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

## Bridge MQTT → Firebase → ESP32
- Pré-req: arquivo service account JSON do Firebase.
- Env para `npm run bridge`: `FIREBASE_DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_PATH`, opcional `MQTT_URL` (padrão `mqtt://localhost:1883`), `MQTT_STATE_TOPIC`, `MQTT_COMMAND_TOPIC`, `MQTT_USERNAME`, `MQTT_PASSWORD`.
- Fluxo: bridge assina `lampada/state` e grava em `/lampada/state` no Realtime Database; observa `/lampada/command` e publica no tópico MQTT de comando para o ESP32.
- O bridge já lê `.env` e tenta achar o JSON do service account na raiz do repo (`*-firebase-adminsdk*.json`, ex: `esp-32-95518-firebase-adminsdk-fbsvc-d48b498046.json`). Passe `FIREBASE_SERVICE_ACCOUNT_PATH` só se quiser caminho custom.
