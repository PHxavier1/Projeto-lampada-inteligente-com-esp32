import { useState, useEffect } from 'react';
import { firebaseService, LampData } from './firebase';
import { Lightbulb, Palette, Power, Wifi, WifiOff, AlertCircle } from 'lucide-react';

function App() {
  const [lampData, setLampData] = useState<LampData>({
    ligado: false,
    cor: "Desligado",
    slider: 0,
    lastUpdated: new Date().toISOString()
  });
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Check environment variables
    const envCheck = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };
    
    setDebugInfo(envCheck);
    console.log('Firebase Environment Check:', envCheck);
    
    // Check if required vars are missing
    const missingVars = Object.entries(envCheck)
      .filter(([, value]) => !value)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      setError(`Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`);
      setLoading(false);
      return;
    }

    // Initialize Firebase connection
    const initFirebase = async () => {
      try {
        console.log('Inicializando Firebase...');
        await firebaseService.initializeLamp();
        console.log('Firebase inicializado com sucesso');
        setConnected(true);
        
        // Listen to real-time updates
        const unsubscribe = firebaseService.onLampStatusChange((data) => {
          console.log('Dados recebidos do Firebase:', data);
          setLampData(data);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error: any) {
        console.error('Firebase connection error:', error);
        setError(`Erro de conexão Firebase: ${error.message || error}`);
        setConnected(false);
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  const handleToggleLamp = async () => {
    try {
      await firebaseService.updateLampStatus(!lampData.ligado);
    } catch (error) {
      console.error('Error toggling lamp:', error);
    }
  };

  const handleSliderChange = async (value: number) => {
    try {
      await firebaseService.updateLampColor(value);
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const getColorInfo = (sliderValue: number) => {
    if (sliderValue < 585) return { name: "Verde", rgb: "#10b981" };
    if (sliderValue < 1170) return { name: "Amarelo", rgb: "#eab308" };
    if (sliderValue < 1755) return { name: "Laranja", rgb: "#f97316" };
    if (sliderValue < 2340) return { name: "Vermelho", rgb: "#ef4444" };
    if (sliderValue < 2925) return { name: "Rosa", rgb: "#ec4899" };
    if (sliderValue < 3510) return { name: "Roxo", rgb: "#8b5cf6" };
    return { name: "Azul", rgb: "#3b82f6" };
  };

  const currentColor = lampData.ligado ? getColorInfo(lampData.slider) : { name: "Desligado", rgb: "#6b7280" };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900">Erro de Configuração</h1>
          </div>
          
          <div className="space-y-4">
            <p className="text-red-600">{error}</p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Como corrigir:</h3>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Crie o arquivo .env na raiz do projeto</li>
                <li>Copie suas credenciais do Firebase Console</li>
                <li>Preencha todas as variáveis VITE_FIREBASE_*</li>
                <li>Reinicie o servidor (npm run dev)</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Debug Info:</h3>
              <pre className="text-xs text-blue-800 overflow-auto">
{JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <p className="text-sm text-gray-500">
              Consulte o arquivo TROUBLESHOOTING.md para mais detalhes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lâmpada Inteligente</h1>
                <p className="text-gray-600">ESP32 + Firebase</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {connected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600">Desconectado</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lamp Control */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Controle da Lâmpada</h2>
            
            {/* Power Control */}
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Power className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Liga/Desliga</h3>
                    <p className="text-sm text-gray-600">Controle principal da lâmpada</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lampData.ligado}
                    onChange={handleToggleLamp}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Color Control */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Controle de Cor</h3>
                    <p className="text-sm text-gray-600">Ajuste a cor da lâmpada</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="4095"
                    step="50"
                    value={lampData.slider}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Verde</span>
                    <span>Amarelo</span>
                    <span>Laranja</span>
                    <span>Vermelho</span>
                    <span>Rosa</span>
                    <span>Roxo</span>
                    <span>Azul</span>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="flex items-center justify-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: currentColor.rgb }}
                  ></div>
                  <span className="text-sm font-medium">{currentColor.name}</span>
                  <span className="text-xs text-gray-500">
                    (Valor: {lampData.slider})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lamp Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Status da Lâmpada</h2>
            
            <div className="space-y-4">
              {/* Visual Lamp */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div 
                    className={`w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center transition-all duration-300 ${
                      lampData.ligado ? 'shadow-lg' : 'shadow-sm'
                    }`}
                    style={{ 
                      backgroundColor: lampData.ligado ? currentColor.rgb : '#f3f4f6',
                      boxShadow: lampData.ligado ? `0 0 30px ${currentColor.rgb}40` : '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Lightbulb 
                      className={`w-16 h-16 ${lampData.ligado ? 'text-white' : 'text-gray-400'}`}
                    />
                  </div>
                  {lampData.ligado && (
                    <div className="absolute -inset-4 rounded-full animate-ping opacity-20"
                         style={{ backgroundColor: currentColor.rgb }}></div>
                  )}
                </div>
              </div>

              {/* Status Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</p>
                  <p className={`text-lg font-semibold ${lampData.ligado ? 'text-green-600' : 'text-gray-600'}`}>
                    {lampData.ligado ? 'Ligada' : 'Desligada'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cor Atual</p>
                  <p className="text-lg font-semibold text-gray-900">{lampData.cor}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Potenciômetro</p>
                  <p className="text-lg font-semibold text-gray-900">{lampData.slider}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Última Atualização</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(lampData.lastUpdated).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Firebase Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Conexão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status Firebase</p>
              <p className={`text-lg font-semibold ${connected ? 'text-green-600' : 'text-red-600'}`}>
                {connected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Caminho dos Dados</p>
              <p className="text-lg font-mono text-gray-900">/lampada/</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;