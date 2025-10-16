import React, { useState, useEffect } from 'react';
import { Mic, Check } from 'lucide-react';

interface Voice {
  name: string;
  displayName: string;
  locale: string;
  gender: string;
  localName?: string;
}

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceName: string) => void;
  className?: string;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ 
  selectedVoice, 
  onVoiceChange,
  className = ''
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Buscar vozes disponíveis do Azure
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const isProduction = window.location.hostname.includes('render.com') || 
                            window.location.hostname.includes('r10piaui');
        
        const API_BASE = isProduction 
          ? window.location.origin
          : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002');
        
        const API_URL = API_BASE.replace('/api', '');
        
        const response = await fetch(`${API_URL}/api/tts/voices`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar vozes');
        }

        const data = await response.json();
        
        if (data.success && data.voices) {
          setVoices(data.voices);
        }
      } catch (error) {
        console.error('Erro ao carregar vozes:', error);
        // Vozes padrão como fallback
        setVoices([
          {
            name: 'pt-BR-AntonioNeural',
            displayName: 'Antonio (Masculina)',
            locale: 'pt-BR',
            gender: 'Male',
            localName: 'Antonio'
          },
          {
            name: 'pt-BR-FranciscaNeural',
            displayName: 'Francisca (Feminina)',
            locale: 'pt-BR',
            gender: 'Female',
            localName: 'Francisca'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const handleVoiceSelect = (voiceName: string) => {
    onVoiceChange(voiceName);
    setShowDropdown(false);
  };

  const selectedVoiceData = voices.find(v => v.name === selectedVoice);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Mic size={16} className="text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Carregando vozes...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <Mic size={16} className="text-purple-600" />
        <span className="font-medium">
          {selectedVoiceData?.displayName || 'Selecionar Voz'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Overlay para fechar dropdown ao clicar fora */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-700">Escolha a Voz do Narrador</p>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {voices.map((voice) => (
                <button
                  key={voice.name}
                  onClick={() => handleVoiceSelect(voice.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors ${
                    voice.name === selectedVoice ? 'bg-purple-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      voice.gender === 'Male' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-pink-100 text-pink-600'
                    }`}>
                      <Mic size={16} />
                    </div>
                    
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {voice.displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {voice.gender === 'Male' ? 'Voz Masculina' : 'Voz Feminina'}
                      </p>
                    </div>
                  </div>
                  
                  {voice.name === selectedVoice && (
                    <Check size={18} className="text-purple-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Powered by Azure Cognitive Services
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceSelector;
