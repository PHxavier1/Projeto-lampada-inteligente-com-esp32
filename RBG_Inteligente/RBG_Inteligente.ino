#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define WIFI_SSID "uaifai-tiradentes"
#define WIFI_PASSWORD "bemvindoaocesar"

#define MQTT_HOST "192.168.0.10"  // ajuste para o IP do broker
#define MQTT_PORT 1883
#define MQTT_USER ""
#define MQTT_PASS ""
#define MQTT_STATE_TOPIC "lampada/state"
#define MQTT_COMMAND_TOPIC "lampada/command"

#define R_PIN 18
#define G_PIN 23
#define B_PIN 19
#define SLIDER_PIN 39
#define BOTAO 27

WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool ledLigado = true;
bool estadoAnteriorBotao = HIGH;
String ultimaCor = "";
int ultimoSlider = -1;
unsigned long ultimaInteracaoLocal = 0;
unsigned long tempoPrioridade = 5000; // 5 segundos de prioridade ao controle local

String determinarCor(int slider) {
  float pos = slider / 4095.0;
  if (pos < 0.14) return "Verde";
  if (pos < 0.28) return "Amarelo";
  if (pos < 0.42) return "Laranja";
  if (pos < 0.57) return "Vermelho";
  if (pos < 0.71) return "Rosa";
  if (pos < 0.85) return "Roxo";
  return "Azul";
}

void setup() {
  Serial.begin(115200);

  pinMode(R_PIN, OUTPUT);
  pinMode(G_PIN, OUTPUT);
  pinMode(B_PIN, OUTPUT);
  pinMode(BOTAO, INPUT_PULLUP);

  analogWrite(R_PIN, 0);
  analogWrite(G_PIN, 0);
  analogWrite(B_PIN, 0);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi OK, IP: ");
  Serial.println(WiFi.localIP());
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback([](char* topic, byte* payload, unsigned int length) {
    if (strcmp(topic, MQTT_COMMAND_TOPIC) != 0) return;

    StaticJsonDocument<200> doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) return;

    bool hasLigado = doc.containsKey("ligado");
    bool hasSlider = doc.containsKey("slider");

    if (!hasLigado && !hasSlider) return;
    if (hasSlider && (millis() - ultimaInteracaoLocal) < tempoPrioridade) return;

    if (hasLigado) {
      ledLigado = doc["ligado"];
    }

    if (hasSlider) {
      int sliderFirebase = doc["slider"];
      sliderFirebase = constrain(sliderFirebase, 0, 4095);
      ultimoSlider = sliderFirebase;
      ultimaCor = determinarCor(sliderFirebase);
      if (ledLigado) {
        atualizarLED(sliderFirebase);
      }
    }

    if (!ledLigado) {
      analogWrite(R_PIN, 0);
      analogWrite(G_PIN, 0);
      analogWrite(B_PIN, 0);
      ultimaCor = "Desligado";
    }

    ultimaInteracaoLocal = millis();
    publicarEstado();
  });

  ultimoSlider = analogRead(SLIDER_PIN);
  ultimaCor = determinarCor(ultimoSlider);
  ultimaInteracaoLocal = millis();
}

void atualizarLED(int valorSlider) {
  int r = 0, g = 0, b = 0;
  float proporcao = valorSlider / 4095.0;
  float segmento = proporcao * 2.0;
  int faixa = (int)segmento;
  int valor = (int)((segmento - faixa) * 255);

  switch (faixa) {
    case 0:
      g = 255 - valor;
      b = valor;
      r = 0;
      break;
    case 1:
      g = 0;
      b = 255 - valor;
      r = valor;
      break;
    default:
      r = 255;
      g = 0;
      b = 0;
      break;
  }

  analogWrite(R_PIN, r);
  analogWrite(G_PIN, g);
  analogWrite(B_PIN, b);
}

void publicarEstado() {
  StaticJsonDocument<200> doc;
  doc["ligado"] = ledLigado;
  doc["slider"] = ultimoSlider;
  doc["cor"] = ultimaCor;
  doc["lastUpdated"] = millis();

  char buffer[200];
  size_t n = serializeJson(doc, buffer);
  mqttClient.publish(MQTT_STATE_TOPIC, buffer, true);
}

void garantirMQTT() {
  while (!mqttClient.connected()) {
    String clientId = "esp32-lamp-";
    clientId += String(random(0xffff), HEX);

    bool conectado;
    if (strlen(MQTT_USER) > 0) {
      conectado = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
    } else {
      conectado = mqttClient.connect(clientId.c_str());
    }

    if (conectado) {
      mqttClient.subscribe(MQTT_COMMAND_TOPIC);
      publicarEstado();
      break;
    }

    delay(1000);
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(500);
    return;
  }
  garantirMQTT();
  mqttClient.loop();

  bool estadoBotao = digitalRead(BOTAO);
  if (estadoAnteriorBotao == HIGH && estadoBotao == LOW) {
    ledLigado = !ledLigado;
    Serial.println(ledLigado ? "LED LIGADO" : "LED DESLIGADO");
    ultimaInteracaoLocal = millis();
    if (!ledLigado) {
      analogWrite(R_PIN, 0);
      analogWrite(G_PIN, 0);
      analogWrite(B_PIN, 0);
      ultimaCor = "Desligado";
    } else {
      atualizarLED(ultimoSlider);
    }
    publicarEstado();
  }
  estadoAnteriorBotao = estadoBotao;

  int valorSlider = analogRead(SLIDER_PIN);

  // Se houver mudança significativa no slider físico, prioriza
  if (abs(valorSlider - ultimoSlider) > 30) {
    ultimoSlider = valorSlider;
    ultimaInteracaoLocal = millis();

    if (ledLigado) {
      atualizarLED(valorSlider);
      String corAtual = determinarCor(valorSlider);

      if (corAtual != ultimaCor) {
        ultimaCor = corAtual;
        Serial.print("Slider: ");
        Serial.print(valorSlider);
        Serial.print(" | Cor: ");
        Serial.println(corAtual);
      }
      publicarEstado();
    }
  }

  delay(100);
}
