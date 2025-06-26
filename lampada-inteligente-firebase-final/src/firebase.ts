import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug: Log configuration (without sensitive data)
console.log('Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasDatabaseURL: !!firebaseConfig.databaseURL,
  hasProjectId: !!firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
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

  // Listen to lamp status changes
  onLampStatusChange(callback: (data: LampData) => void) {
    return onValue(this.lampRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  }

  // Update lamp on/off status
  async updateLampStatus(ligado: boolean): Promise<void> {
    const cor = ligado ? this.getColorFromSlider(0) : "Desligado";
    await update(this.lampRef, {
      ligado,
      cor,
      lastUpdated: new Date().toISOString()
    });
  }

  // Update lamp color via slider
  async updateLampColor(sliderValue: number): Promise<void> {
    const cor = this.getColorFromSlider(sliderValue);
    await update(this.lampRef, {
      slider: sliderValue,
      cor,
      lastUpdated: new Date().toISOString()
    });
  }

  // Get color name from slider value
  private getColorFromSlider(value: number): string {
    if (value < 585) return "Verde";
    if (value < 1170) return "Amarelo";
    if (value < 1755) return "Laranja";
    if (value < 2340) return "Vermelho";
    if (value < 2925) return "Rosa";
    if (value < 3510) return "Roxo";
    return "Azul";
  }

  // Initialize lamp data if not exists
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