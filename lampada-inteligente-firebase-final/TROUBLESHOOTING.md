# 🔧 Solução de Problemas - Tela Branca

## Problema: Tela branca após instalação

### Passo 1: Verificar o Console do Navegador
1. Abra o navegador (Chrome/Firefox)
2. Pressione `F12` para abrir as ferramentas de desenvolvedor
3. Clique na aba "Console"
4. Procure por erros em vermelho

### Erros Comuns e Soluções

#### ❌ Erro: "Firebase configuration error"
**Causa:** Credenciais do Firebase incorretas
**Solução:**
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Confirme se todas as variáveis estão preenchidas:
```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### ❌ Erro: "Permission denied"
**Causa:** Regras do Firebase muito restritivas
**Solução:**
1. Vá no Firebase Console → Realtime Database → Regras
2. Use essas regras temporariamente:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### ❌ Erro: "Module not found"
**Causa:** Dependências não instaladas
**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Passo 2: Verificar Configuração Firebase

#### Teste Manual das Credenciais
1. Acesse Firebase Console
2. Vá em Configurações → Geral
3. Role até "Seus aplicativos"
4. Verifique se a configuração bate com o `.env`

#### Verificar Realtime Database
1. No Firebase Console, vá em Realtime Database
2. Deve mostrar URL como: `https://seu-projeto-default-rtdb.firebaseio.com/`
3. Se não existir, clique em "Criar banco de dados"

### Passo 3: Teste Passo a Passo

#### 1. Teste Básico
Crie arquivo `test.html` temporário:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste Firebase</title>
</head>
<body>
    <h1>Teste Firebase</h1>
    <div id="status">Carregando...</div>
    
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
        
        const firebaseConfig = {
            apiKey: "SUA_API_KEY",
            authDomain: "SEU_AUTH_DOMAIN",
            databaseURL: "SUA_DATABASE_URL",
            projectId: "SEU_PROJECT_ID",
            storageBucket: "SEU_STORAGE_BUCKET",
            messagingSenderId: "SEU_SENDER_ID",
            appId: "SEU_APP_ID"
        };
        
        try {
            const app = initializeApp(firebaseConfig);
            const database = getDatabase(app);
            document.getElementById('status').innerHTML = 'Firebase conectado com sucesso!';
        } catch (error) {
            document.getElementById('status').innerHTML = 'Erro: ' + error.message;
        }
    </script>
</body>
</html>
```

#### 2. Verificar Variáveis de Ambiente
Adicione no início do `App.tsx`:
```javascript
console.log('Variáveis Firebase:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
});
```

### Passo 4: Configuração Alternativa

Se continuar com problemas, use esta versão simplificada do `firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update } from 'firebase/database';

// Configuração direta (para teste)
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, update };
```

### Checklist de Verificação

- [ ] Arquivo `.env` existe e está preenchido
- [ ] Projeto Firebase criado e Realtime Database ativado
- [ ] Regras do Firebase permitem leitura/escrita
- [ ] `npm install` executado com sucesso
- [ ] Console do navegador não mostra erros
- [ ] URL do database termina com `-default-rtdb.firebaseio.com/`

### Ainda com problemas?

1. **Envie screenshot** do console do navegador (F12)
2. **Compartilhe** o conteúdo do arquivo `.env` (sem as chaves)
3. **Confirme** a URL do Firebase Realtime Database

### Solução Rápida: Versão Offline

Se o Firebase não funcionar, use esta versão que simula os dados:

```typescript
// firebase-mock.ts
export const firebaseService = {
  onLampStatusChange: (callback) => {
    // Simula dados da lâmpada
    callback({
      ligado: false,
      cor: "Desligado",
      slider: 0,
      lastUpdated: new Date().toISOString()
    });
  },
  updateLampStatus: async (ligado) => {
    console.log('Mock: Lâmpada', ligado ? 'ligada' : 'desligada');
  },
  updateLampColor: async (slider) => {
    console.log('Mock: Cor alterada para', slider);
  },
  initializeLamp: async () => {
    console.log('Mock: Firebase inicializado');
  }
};
```