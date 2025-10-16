import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Mic, Check, AlertCircle } from 'lucide-react';
import VoiceSelector from './VoiceSelector';

interface Voice {
  name: string;
  displayName: string;
  locale: string;
  gender: string;
  localName?: string;
}

const Settings: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-AntonioNeural');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [ttsStatus, setTtsStatus] = useState<any>(null);

  // Buscar configurações atuais
  useEffect(() => {
    fetchSettings();
    checkTtsStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/api/settings/tts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.voiceName) {
          setSelectedVoice(data.voiceName);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTtsStatus = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/api/tts/status`);
      
      if (response.ok) {
        const data = await response.json();
        setTtsStatus(data);
      }
    } catch (error) {
      console.error('Erro ao verificar status TTS:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE}/api/settings/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          voiceName: selectedVoice
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="text-white" size={24} />
            <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status TTS */}
          {ttsStatus && (
            <div className={`p-4 rounded-lg border ${
              ttsStatus.configured 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  ttsStatus.configured ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {ttsStatus.configured ? (
                    <Check className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-600" size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    ttsStatus.configured ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {ttsStatus.configured ? 'Azure TTS Configurado' : 'Azure TTS Não Configurado'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    ttsStatus.configured ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {ttsStatus.configured 
                      ? `Região: ${ttsStatus.region} | Vozes disponíveis: ${ttsStatus.availableVoices || 'N/A'}`
                      : 'Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION no arquivo .env'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seção Text-to-Speech */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="text-purple-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                Text-to-Speech (Azure)
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voz Padrão do Narrador
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Selecione a voz que será usada por padrão para gerar áudio das matérias.
                  Esta configuração afeta todas as novas gerações de áudio.
                </p>

                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                  className="mb-4"
                />

                {/* Preview da voz selecionada */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Voz Selecionada:</h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedVoice.includes('Antonio') 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-pink-100 text-pink-600'
                    }`}>
                      <Mic size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedVoice}</p>
                      <p className="text-sm text-gray-500">
                        {selectedVoice.includes('Antonio') ? 'Voz Masculina Neural' : 'Voz Feminina Neural'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Dica</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Vozes neurais oferecem qualidade superior e naturalidade</li>
                  <li>• Antonio: Voz masculina, ideal para notícias e conteúdo formal</li>
                  <li>• Francisca: Voz feminina, ideal para variedade e conteúdo leve</li>
                  <li>• A mudança afeta apenas novos áudios gerados</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <Check size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
