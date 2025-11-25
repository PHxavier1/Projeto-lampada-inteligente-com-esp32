import mqtt, { MqttClient } from 'mqtt';

export interface LampData {
  ligado: boolean;
  cor: string;
  slider: number;
  lastUpdated: string;
}

interface ConnectHandlers {
  onState: (data: LampData) => void;
  onConnect?: () => void;
  onDisconnect?: (message: string | null) => void;
}

class MqttService {
  private client: MqttClient | null = null;
  private readonly stateTopic = 'lampada/state';
  private readonly commandTopic = 'lampada/command';

  private getConfig() {
    const host = import.meta.env.VITE_MQTT_HOST || window.location.hostname || 'localhost';
    const port = parseInt(import.meta.env.VITE_MQTT_PORT || '9001', 10);
    const path = import.meta.env.VITE_MQTT_PATH || '/mqtt';
    const useTls = import.meta.env.VITE_MQTT_TLS === 'true';
    const protocol = useTls ? 'wss' : 'ws';

    return {
      url: `${protocol}://${host}:${port}${path.startsWith('/') ? path : `/${path}`}`,
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
    };
  }

  connect(handlers: ConnectHandlers) {
    const { url, username, password } = this.getConfig();

    this.client = mqtt.connect(url, {
      username,
      password,
      reconnectPeriod: 2000,
    });

    this.client.on('connect', () => {
      this.client?.subscribe(this.stateTopic);
      handlers.onConnect?.();
    });

    this.client.on('reconnect', () => {
      handlers.onDisconnect?.('Reconectando ao MQTT...');
    });

    this.client.on('close', () => {
      handlers.onDisconnect?.('MQTT desconectado');
    });

    this.client.on('error', (err) => {
      handlers.onDisconnect?.(`MQTT erro: ${err.message}`);
    });

    this.client.on('message', (_topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        if (data && typeof data === 'object') {
          handlers.onState({
            ligado: !!data.ligado,
            cor: data.cor || 'Desligado',
            slider: typeof data.slider === 'number' ? data.slider : 0,
            lastUpdated: String(data.lastUpdated || new Date().toISOString()),
          });
        }
      } catch (error) {
        console.error('Erro ao parsear mensagem MQTT', error);
      }
    });

    return () => {
      this.client?.end(true);
      this.client = null;
    };
  }

  updateLampStatus(ligado: boolean, slider: number) {
    this.publishCommand({ ligado, slider });
  }

  updateLampColor(slider: number) {
    this.publishCommand({ slider, ligado: true });
  }

  private publishCommand(payload: Record<string, unknown>) {
    if (!this.client) {
      throw new Error('MQTT não conectado');
    }
    this.client.publish(this.commandTopic, JSON.stringify(payload));
  }
}

export const mqttService = new MqttService();
