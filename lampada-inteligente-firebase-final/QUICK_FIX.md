# 🚨 Correção Rápida - Tela Branca

## Problema: Tela branca após npm run dev

### Solução em 3 passos:

#### 1. Verificar Console do Navegador
1. Abra http://localhost:5173
2. Pressione F12 
3. Vá na aba "Console"
4. Procure erros em vermelho

#### 2. Casos mais comuns:

**A) Arquivo .env não existe**
```bash
# Na raiz do projeto, crie:
cp .env.example .env
```

**B) Variáveis vazias no .env**
Edite o arquivo .env:
```env
VITE_FIREBASE_API_KEY=AIzaSyC...  ← Cole sua chave aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**C) Realtime Database não ativado**
1. Firebase Console → Realtime Database
2. "Criar banco de dados"
3. Escolha localização
4. Modo teste

#### 3. Teste rápido
Depois de configurar, reinicie:
```bash
npm run dev
```

### Se ainda não funcionar:

Use esta versão de emergência do arquivo `src/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

// COLE SUAS CREDENCIAIS DIRETAMENTE AQUI (temporário para teste)
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com", 
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface LampData {
  ligado: boolean;
  cor: string;
  slider: number;
  lastUpdated: string;
}

export class FirebaseService {
  private lampRef = ref(database, 'lampada');

  onLampStatusChange(callback: (data: LampData) => void) {
    return onValue(this.lampRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  }

  async updateLampStatus(ligado: boolean): Promise<void> {
    const cor = ligado ? this.getColorFromSlider(0) : "Desligado";
    await update(this.lampRef, {
      ligado,
      cor,
      lastUpdated: new Date().toISOString()
    });
  }

  async updateLampColor(sliderValue: number): Promise<void> {
    const cor = this.getColorFromSlider(sliderValue);
    await update(this.lampRef, {
      slider: sliderValue,
      cor,
      lastUpdated: new Date().toISOString()
    });
  }

  private getColorFromSlider(value: number): string {
    if (value < 585) return "Verde";
    if (value < 1170) return "Amarelo";
    if (value < 1755) return "Laranja";
    if (value < 2340) return "Vermelho";
    if (value < 2925) return "Rosa";
    if (value < 3510) return "Roxo";
    return "Azul";
  }

  async initializeLamp(): Promise<void> {
    const snapshot = await new Promise((resolve) => {
      onValue(this.lampRef, resolve, { onlyOnce: true });
    });
    
    if (!(snapshot as any).exists()) {
      await set(this.lampRef, {
        ligado: false,
        cor: "Desligado",
        slider: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  }
}

export const firebaseService = new FirebaseService();
```

Substitua "SUA_API_KEY_AQUI" pelas suas credenciais reais do Firebase.