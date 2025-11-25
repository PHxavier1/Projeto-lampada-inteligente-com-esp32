# Lâmpada Inteligente ESP32 - Frontend MQTT

Frontend standalone para a lâmpada ESP32 agora via MQTT (broker local ou remoto com WebSocket habilitado).

## Configuração Rápida

### 1. Configurar Broker MQTT
1. Use Mosquitto com listeners TCP e WebSocket (exemplo: 1883 e 9001).
2. Deixe anon liberado para teste ou configure usuário/senha/TLS.

### 2. Variáveis de Ambiente (.env)
```
VITE_MQTT_HOST=localhost
VITE_MQTT_PORT=9001
VITE_MQTT_PATH=/mqtt
# VITE_MQTT_TLS=true
# VITE_MQTT_USERNAME=seu_usuario
# VITE_MQTT_PASSWORD=sua_senha
```

### 3. Instalar e Executar
```bash
npm install
npm run dev
```

## Funcionalidades

- ✅ Controle de liga/desliga da lâmpada
- ✅ Seleção de 7 cores via slider (Verde, Amarelo, Laranja, Vermelho, Rosa, Roxo, Azul)
- ✅ Sincronização em tempo real via MQTT
- ✅ Interface responsiva e moderna
- ✅ Logs de atividades
- ✅ Preview visual das cores

## MQTT

Tópicos usados:
- `lampada/state` (retain) — enviado pelo ESP32: `{ ligado, slider, cor, lastUpdated }`
- `lampada/command` — enviado pelo frontend: `{ ligado?, slider? }`

## Compatibilidade com ESP32

Este frontend é compatível com o código Arduino ESP32 que:
- Publica `lampada/state` via MQTT
- Aplica comandos recebidos em `lampada/command`
- Controla LED RGB e slider físico

## Deploy

Para fazer deploy:
1. Execute `npm run build`
2. Faça upload da pasta `dist/` para seu serviço de hospedagem
3. Configure as variáveis de ambiente no serviço de hospedagem

## Suporte

Este frontend funciona com qualquer projeto Firebase configurado corretamente e é compatível com o código ESP32 fornecido no projeto.
