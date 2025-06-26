# Guia de Implementação - Lâmpada Inteligente ESP32 Firebase

## 📋 O que você recebeu

Este pacote contém um frontend completo para controlar uma lâmpada inteligente ESP32 via Firebase. O sistema permite:

- Ligar/desligar a lâmpada remotamente
- Controlar 7 cores diferentes via slider
- Monitoramento em tempo real
- Interface web responsiva

## 🚀 Configuração Rápida (5 minutos)

### Passo 1: Configurar Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Dê um nome ao projeto (ex: "lampada-inteligente")
4. Desative o Google Analytics (opcional)
5. Clique em "Criar projeto"

### Passo 2: Ativar Realtime Database
1. No painel do Firebase, clique em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha uma localização (preferencialmente Brasil)
4. Selecione "Iniciar no modo de teste"
5. Clique em "Concluído"

### Passo 3: Configurar Regras de Segurança
1. Na aba "Regras" do Realtime Database
2. Substitua o conteúdo por:
```json
{
  "rules": {
    "lampada": {
      ".read": true,
      ".write": true
    }
  }
}
```
3. Clique em "Publicar"

### Passo 4: Obter Credenciais
1. Clique no ícone de engrenagem ⚙️ → "Configurações do projeto"
2. Role até "Seus aplicativos"
3. Clique em "Web" (ícone </>) 
4. Dê um nome ao app (ex: "Controle Lampada")
5. Não precisa configurar Firebase Hosting
6. Copie as credenciais que aparecem

### Passo 5: Configurar o Projeto
1. Descompacte os arquivos do frontend
2. Copie o arquivo `.env.example` para `.env`
3. Edite o arquivo `.env` com suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSyC... (cole aqui)
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

### Passo 6: Executar o Projeto
1. Abra o terminal na pasta do projeto
2. Execute:
```bash
npm install
npm run dev
```
3. Acesse http://localhost:5173

## 🔧 Estrutura dos Dados no Firebase

O sistema cria automaticamente esta estrutura no seu Realtime Database:

```json
{
  "lampada": {
    "ligado": false,
    "cor": "Desligado", 
    "slider": 0,
    "lastUpdated": "2025-06-21T12:00:00.000Z"
  }
}
```

## 🎨 Cores Disponíveis

O slider controla 7 cores baseado no valor (0-4095):

| Faixa | Cor | Valor RGB |
|-------|-----|-----------|
| 0-584 | Verde | #10b981 |
| 585-1169 | Amarelo | #eab308 |
| 1170-1754 | Laranja | #f97316 |
| 1755-2339 | Vermelho | #ef4444 |
| 2340-2924 | Rosa | #ec4899 |
| 2925-3509 | Roxo | #8b5cf6 |
| 3510-4095 | Azul | #3b82f6 |

## 🔌 Integração com ESP32

Para conectar com seu ESP32, use este código Arduino:

```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>

// Configuração Firebase
#define FIREBASE_HOST "seu-projeto-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "sua-database-secret" // Opcional para modo teste

FirebaseData firebaseData;

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  WiFi.begin("sua-rede", "sua-senha");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando WiFi...");
  }
  
  // Inicializar Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // Ler status da lâmpada
  if (Firebase.getBool(firebaseData, "/lampada/ligado")) {
    bool lampada_ligada = firebaseData.boolData();
    
    if (lampada_ligada) {
      // Ler cor/slider
      if (Firebase.getInt(firebaseData, "/lampada/slider")) {
        int valor_slider = firebaseData.intData();
        // Aplicar cor baseada no valor do slider
        aplicarCor(valor_slider);
      }
    } else {
      // Desligar lâmpada
      desligarLampada();
    }
  }
  
  delay(1000); // Verificar a cada segundo
}
```

## 🌐 Deploy para Produção

### Opção 1: Netlify (Gratuito)
1. Faça build: `npm run build`
2. Acesse [netlify.com](https://netlify.com)
3. Arraste a pasta `dist/` para o site
4. Configure as variáveis de ambiente no painel

### Opção 2: Vercel (Gratuito)
1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Siga as instruções
4. Configure as variáveis de ambiente

### Opção 3: Firebase Hosting
1. Instale Firebase CLI: `npm i -g firebase-tools`
2. Execute: `firebase init hosting`
3. Configure a pasta `dist` como public
4. Execute: `firebase deploy`

## 🐛 Solução de Problemas

### Problema: "Firebase connection error"
- Verifique se as credenciais no `.env` estão corretas
- Confirme se o Realtime Database está ativado
- Verifique as regras de segurança

### Problema: Slider não funciona
- Verifique se o Firebase está conectado
- Confirme se as regras permitem escrita em `/lampada/`

### Problema: ESP32 não recebe dados
- Verifique a URL do Firebase no código Arduino
- Confirme se o WiFi está conectado
- Teste a conexão manualmente no Firebase Console

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12) para erros
2. Confirme se o Firebase Console mostra os dados sendo atualizados
3. Teste primeiro pelo interface web antes de conectar o ESP32

## 📄 Arquivos Inclusos

```
lampada-inteligente-firebase/
├── src/
│   ├── App.tsx          # Interface principal
│   ├── firebase.ts      # Configuração Firebase
│   ├── main.tsx         # Ponto de entrada
│   └── index.css        # Estilos
├── package.json         # Dependências
├── vite.config.ts       # Configuração Vite
├── tailwind.config.js   # Configuração Tailwind
├── .env.example         # Exemplo de variáveis
└── README.md           # Documentação
```

Pronto! Agora você tem tudo para controlar sua lâmpada ESP32 via web.