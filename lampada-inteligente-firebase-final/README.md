# Lâmpada Inteligente ESP32 - Frontend Firebase

Este é o frontend standalone para o projeto de lâmpada inteligente ESP32 que funciona diretamente com Firebase.

## Configuração Rápida

### 1. Configurar Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto ou use um existente
3. Ative o "Realtime Database"
4. Configure as regras do banco de dados:

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

### 2. Obter Credenciais
1. No console Firebase, vá em Configurações do projeto (ícone engrenagem)
2. Role até "Seus aplicativos" e clique em "Configuração"
3. Copie as credenciais do firebaseConfig

### 3. Configurar o Projeto
1. Crie um arquivo `.env` na raiz do projeto
2. Adicione suas credenciais Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu_projeto-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Instalar e Executar
```bash
npm install
npm run dev
```

## Funcionalidades

- ✅ Controle de liga/desliga da lâmpada
- ✅ Seleção de 7 cores via slider (Verde, Amarelo, Laranja, Vermelho, Rosa, Roxo, Azul)
- ✅ Sincronização em tempo real com Firebase
- ✅ Interface responsiva e moderna
- ✅ Logs de atividades
- ✅ Preview visual das cores

## Estrutura do Firebase

O sistema usa o caminho `/lampada/` no Realtime Database com a seguinte estrutura:

```json
{
  "lampada": {
    "ligado": false,
    "cor": "Desligado",
    "slider": 0,
    "lastUpdated": "2025-06-21T00:00:00.000Z"
  }
}
```

## Compatibilidade com ESP32

Este frontend é compatível com o código Arduino ESP32 que:
- Lê valores do Firebase no caminho `/lampada/`
- Atualiza o status da lâmpada em tempo real
- Controla LED RGB nas cores definidas
- Sincroniza com potenciômetro físico

## Deploy

Para fazer deploy:
1. Execute `npm run build`
2. Faça upload da pasta `dist/` para seu serviço de hospedagem
3. Configure as variáveis de ambiente no serviço de hospedagem

## Suporte

Este frontend funciona com qualquer projeto Firebase configurado corretamente e é compatível com o código ESP32 fornecido no projeto.