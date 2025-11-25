# Projeto lâmpada ESP32
- Frontend Vite MQTT: `lampada-inteligente-firebase-final/`
- Sketch ESP32: `RBG_Inteligente/`
- Mosquitto sample: `mqtt.conf` (listeners 1883/9001 WS)

## Rodar
1. `mosquitto -c mqtt.conf`
2. `cd lampada-inteligente-firebase-final`
3. Ajuste `.env` (host/port/path/TLS/user/pass)
4. `npm install && npm run dev`

MQTT tópicos: `lampada/state` retain pelo ESP32, `lampada/command` comandos UI. Ajuste Wi-Fi/MQTT no `.ino` conforme rede.
