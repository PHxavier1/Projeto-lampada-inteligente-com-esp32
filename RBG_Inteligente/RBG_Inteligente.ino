#include <WiFi.h>
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

#define WIFI_SSID "uaifai-tiradentes"
#define WIFI_PASSWORD "bemvindoaocesar"
#define API_KEY "AIzaSyDTv4ijb1uYJM8ZtikEjy6MaDhRkSEHAFw"
#define DATABASE_URL "https://esp-32-95518-default-rtdb.firebaseio.com/"
#define USER_EMAIL "phsx@cesar.school"
#define USER_PASSWORD "phsx123!"

#define R_PIN 18
#define G_PIN 23
#define B_PIN 19
#define SLIDER_PIN 39
#define BOTAO 27

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

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
  Serial.print("Conectado com IP: ");
  Serial.println(WiFi.localIP());

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);

  Serial.println("Conectando ao Firebase...");
  while (!Firebase.ready()) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nFirebase conectado!");
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

void loop() {
  bool estadoBotao = digitalRead(BOTAO);
  if (estadoAnteriorBotao == HIGH && estadoBotao == LOW) {
    ledLigado = !ledLigado;
    Serial.println(ledLigado ? "LED LIGADO" : "LED DESLIGADO");
    if (Firebase.ready()) {
      Firebase.setBool(fbdo, "/lampada/ligado", ledLigado);
      Firebase.setString(fbdo, "/lampada/cor", ledLigado ? ultimaCor : "Desligado");
    }
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

        if (Firebase.ready()) {
          Firebase.setInt(fbdo, "/lampada/slider", valorSlider);
          Firebase.setString(fbdo, "/lampada/cor", corAtual);
        }
      }
    }
  }

  // Após 5 segundos sem interação física, lê do Firebase
  if (millis() - ultimaInteracaoLocal > tempoPrioridade) {
    if (Firebase.ready()) {
      if (Firebase.getBool(fbdo, "/lampada/ligado")) {
        ledLigado = fbdo.boolData();
      }
      if (Firebase.getInt(fbdo, "/lampada/slider")) {
        int sliderFirebase = fbdo.intData();
        if (ledLigado) {
          atualizarLED(sliderFirebase);
          String corFirebase = determinarCor(sliderFirebase);

          if (corFirebase != ultimaCor) {
            ultimaCor = corFirebase;
            Serial.print("[Remoto] Slider: ");
            Serial.print(sliderFirebase);
            Serial.print(" | Cor: ");
            Serial.println(corFirebase);
          }
        } else {
          analogWrite(R_PIN, 0);
          analogWrite(G_PIN, 0);
          analogWrite(B_PIN, 0);
        }
      }
    }
  }

  delay(100);
}
