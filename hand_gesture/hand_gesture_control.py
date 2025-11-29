#!/usr/bin/env python3
"""Hand gesture brightness control for smart lamp via MQTT."""

import os
import sys
import signal
import json
from collections import deque
from urllib.parse import urlparse

import cv2
from cvzone.HandTrackingModule import HandDetector
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Finger count to slider value mapping (blue→red color gradient)
FINGER_TO_SLIDER = {
    1: 2048,  # blue
    2: 2560,  # blue-purple
    3: 3072,  # purple
    4: 3584,  # red-purple
    5: 4095,  # red
}

STABILITY_THRESHOLD = 5  # frames before publishing

running = True


def signal_handler(sig, frame):
    """Handle Ctrl+C for graceful shutdown."""
    global running
    print("\nShutting down...")
    running = False


def load_config():
    """Load MQTT config from environment variables."""
    # Load .env from current dir
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

    mqtt_url = os.getenv('MQTT_URL', 'mqtt://localhost:1883')
    parsed = urlparse(mqtt_url)

    return {
        'mqtt_host': parsed.hostname or 'localhost',
        'mqtt_port': parsed.port or 1883,
        'mqtt_username': os.getenv('MQTT_USERNAME'),
        'mqtt_password': os.getenv('MQTT_PASSWORD'),
        'command_topic': os.getenv('MQTT_COMMAND_TOPIC', 'lampada/command'),
    }


def on_connect(client, userdata, flags, reason_code, properties):
    """MQTT connection callback."""
    if reason_code == 0:
        print(f"MQTT connected to {userdata['host']}:{userdata['port']}")
    else:
        print(f"MQTT connection failed: {reason_code}")


def create_mqtt_client(config):
    """Create and connect MQTT client."""
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        userdata={'host': config['mqtt_host'], 'port': config['mqtt_port']}
    )
    client.on_connect = on_connect

    if config['mqtt_username']:
        client.username_pw_set(config['mqtt_username'], config['mqtt_password'])

    client.connect(config['mqtt_host'], config['mqtt_port'])
    client.loop_start()
    return client


def publish_command(client, topic, slider_value):
    """Publish brightness command to MQTT."""
    payload = json.dumps({'ligado': True, 'slider': slider_value})
    client.publish(topic, payload)
    print(f"Published: slider={slider_value} ({slider_value * 100 // 4095}%)")


def get_stable_count(buffer):
    """Return finger count if stable for threshold frames, else None."""
    if len(buffer) < STABILITY_THRESHOLD:
        return None
    if len(set(buffer)) == 1:
        return buffer[0]
    return None


def draw_overlay(frame, finger_count, slider_value, mqtt_connected):
    """Draw status overlay on webcam frame."""
    h, w = frame.shape[:2]

    # Background for text
    cv2.rectangle(frame, (10, 10), (300, 120), (0, 0, 0), -1)
    cv2.rectangle(frame, (10, 10), (300, 120), (255, 255, 255), 2)

    # Finger count
    count_text = str(finger_count) if finger_count is not None else "-"
    cv2.putText(frame, f"Fingers: {count_text}", (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    # Brightness
    if slider_value is not None:
        pct = slider_value * 100 // 4095
        cv2.putText(frame, f"Brightness: {pct}%", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    else:
        cv2.putText(frame, "Brightness: -", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (128, 128, 128), 2)

    # MQTT status
    status_color = (0, 255, 0) if mqtt_connected else (0, 0, 255)
    status_text = "MQTT: OK" if mqtt_connected else "MQTT: Disconnected"
    cv2.putText(frame, status_text, (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)

    # Instructions
    cv2.putText(frame, "Press 'q' to quit", (w - 180, h - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

    return frame


def main():
    global running
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("Hand Gesture Brightness Control")
    print("================================")

    config = load_config()
    print(f"MQTT: {config['mqtt_host']}:{config['mqtt_port']}")
    print(f"Topic: {config['command_topic']}")

    # MQTT setup
    client = create_mqtt_client(config)

    # Camera setup
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam")
        sys.exit(1)

    # Hand detector
    detector = HandDetector(detectionCon=0.8, maxHands=1)

    buffer = deque(maxlen=STABILITY_THRESHOLD)
    last_slider = None
    current_count = None

    print("\nShow 1-5 fingers to control brightness")
    print("Press 'q' or Ctrl+C to quit\n")

    while running:
        success, frame = cap.read()
        if not success:
            continue

        # Flip for mirror effect
        frame = cv2.flip(frame, 1)

        # Detect hands
        hands, frame = detector.findHands(frame, draw=True)

        if hands:
            fingers = detector.fingersUp(hands[0])
            count = sum(fingers)
            current_count = count

            if count > 0:
                buffer.append(count)
                stable_count = get_stable_count(buffer)

                if stable_count is not None:
                    slider = FINGER_TO_SLIDER.get(stable_count)
                    if slider is not None and slider != last_slider:
                        publish_command(client, config['command_topic'], slider)
                        last_slider = slider
        else:
            current_count = None
            buffer.clear()

        # Draw overlay
        frame = draw_overlay(frame, current_count, last_slider, client.is_connected())

        cv2.imshow("Hand Gesture Control", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    print("Cleaning up...")
    cap.release()
    cv2.destroyAllWindows()
    client.loop_stop()
    client.disconnect()
    print("Done")


if __name__ == '__main__':
    main()
