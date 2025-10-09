import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Zap } from 'lucide-react';
import { useTts } from '../hooks/useTts';

interface Post {
  id: string;
  posicao?: string;
  title?: string;
  subtitle?: string;
}

interface SmartAudioPlayerProps {
  post: Post | null;
  content: string;
}

const SmartAudioPlayer: React.FC<SmartAudioPlayerProps> = ({ post, content }) => {
  // Hook ElevenLabs TTS
  const { enabled: elevenLabsEnabled, loading: elevenLabsLoading, url: elevenLabsUrl, onClick: generateElevenLabs } = useTts(post);
  
  // Estados para Web Speech API (fallback/notícias comuns)
  const [isWebSpeechPlaying, setIsWebSpeechPlaying] = useState(false);
  const [isWebSpeechLoading, setIsWebSpeechLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Estados para sequência vinheta + ElevenLabs
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'vinheta' | 'tts'>('idle');
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vinhetaRef = useRef<HTMLAudioElement | null>(null);

  // Escolher vinheta aleatória
  const getRandomVinheta = (): string => {
    const vinhetas = ['/audio/vinheta1.mp3', '/audio/vinheta2.mp3', '/audio/vinheta3.mp3'];
    return vinhetas[Math.floor(Math.random() * vinhetas.length)];
  };

  // Tocar sequência: vinheta + ElevenLabs
  const playSequence = async () => {
    setIsPlayingSequence(true);
    setCurrentPhase('vinheta');

    try {
      // 1. PRIMEIRO: Garantir que o áudio ElevenLabs está disponível
      console.log('🎵 Gerando áudio ElevenLabs antes da vinheta...');
      if (!elevenLabsUrl) {
        await generateElevenLabs();
      }

      // 2. DEPOIS: Tocar vinheta aleatória
      const vinhetaUrl = getRandomVinheta();
      console.log('🎵 Tocando vinheta:', vinhetaUrl);
      
      vinhetaRef.current = new Audio(vinhetaUrl);
      vinhetaRef.current.volume = 0.8;
      
      vinhetaRef.current.onended = async () => {
        console.log('🎵 Vinheta terminada, iniciando TTS...');
        setCurrentPhase('tts');
        
        // 3. Tocar ElevenLabs (já está gerado) ou fallback para Web Speech
        if (elevenLabsUrl) {
          console.log('✅ ElevenLabs disponível, tocando...');
          playElevenLabsAudio(elevenLabsUrl);
        } else {
          console.warn('⚠️ ElevenLabs não disponível, usando Web Speech API como fallback');
          setIsPlayingSequence(false);
          setCurrentPhase('idle');
          // Usar Web Speech API como fallback
          await playWithWebSpeech();
        }
      };
      
      vinhetaRef.current.onerror = () => {
        console.error('❌ Erro ao carregar vinheta');
        setIsPlayingSequence(false);
        setCurrentPhase('idle');
      };
      
      vinhetaRef.current.play().catch(error => {
        console.error('❌ Erro ao tocar vinheta:', error);
        setIsPlayingSequence(false);
        setCurrentPhase('idle');
      });

    } catch (error) {
      console.error('❌ Erro ao gerar ElevenLabs:', error);
      setIsPlayingSequence(false);
      setCurrentPhase('idle');
    }
  };

  // Tocar áudio ElevenLabs
  const playElevenLabsAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(url);
    audioRef.current.volume = 0.9;

    audioRef.current.onloadedmetadata = () => {
      setDuration(audioRef.current?.duration || 0);
    };

    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(currentProgress || 0);
      }
    };

    audioRef.current.onended = () => {
      setProgress(0);
      setIsPlayingSequence(false);
      setCurrentPhase('idle');
      console.log('🎉 Sequência vinheta + ElevenLabs concluída!');
    };

    audioRef.current.onerror = () => {
      console.error('❌ Erro ao reproduzir ElevenLabs');
      setIsPlayingSequence(false);
      setCurrentPhase('idle');
    };

    audioRef.current.play().then(() => {
      console.log('🤖 ElevenLabs tocando...');
    }).catch(error => {
      console.error('❌ Erro ao iniciar ElevenLabs:', error);
      setIsPlayingSequence(false);
      setCurrentPhase('idle');
    });
  };

  // Parar sequência
  const stopSequence = () => {
    if (vinhetaRef.current) {
      vinhetaRef.current.pause();
      vinhetaRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingSequence(false);
    setCurrentPhase('idle');
    setProgress(0);
  };

  // TTS básico para notícias comuns
  const playWithWebSpeech = async () => {
    if (!content) return;

    setIsWebSpeechLoading(true);
    
    try {
      const optimizedText = content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Buscar a melhor voz PT-BR disponível
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;

      // Prioridade de vozes: Google > Microsoft > outras
      const voicePriority = [
        'Google português do Brasil',
        'Microsoft Maria Desktop',
        'Microsoft Daniel Desktop', 
        'Google pt-BR',
        'pt-BR',
        'pt_BR'
      ];

      for (const priority of voicePriority) {
        selectedVoice = voices.find(v => 
          v.lang.includes('pt-BR') && v.name.includes(priority)
        );
        if (selectedVoice) break;
      }

      // Fallback: qualquer voz PT-BR
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
      }

      console.log('🎤 Voz selecionada:', selectedVoice?.name || 'Padrão do sistema');

      const utterance = new SpeechSynthesisUtterance(optimizedText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      setIsWebSpeechLoading(false);
      
      utterance.onstart = () => {
        setIsWebSpeechPlaying(true);
        const estimatedDuration = (optimizedText.length / 15) * 1000;
        setDuration(estimatedDuration / 1000);
        
        // Simular progresso
        let progressValue = 0;
        const progressInterval = setInterval(() => {
          progressValue += 2;
          if (progressValue >= 100) {
            clearInterval(progressInterval);
            return;
          }
          setProgress(progressValue);
        }, estimatedDuration / 50);
      };
        
      utterance.onend = () => {
        setIsWebSpeechPlaying(false);
        setProgress(0);
      };
      
      utterance.onerror = () => {
        setIsWebSpeechPlaying(false);
        setIsWebSpeechLoading(false);
        setProgress(0);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Erro no Web Speech API:', error);
      setIsWebSpeechLoading(false);
    }
  };

  // Handler principal
  const handlePlay = async () => {
    // Se sequência está tocando, parar
    if (isPlayingSequence) {
      stopSequence();
      return;
    }

    // Se Web Speech está tocando, parar
    if (isWebSpeechPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsWebSpeechPlaying(false);
      } else {
        speechSynthesis.cancel();
        setIsWebSpeechPlaying(false);
      }
      return;
    }

    // Se ElevenLabs está habilitado, usar sequência vinheta + TTS
    if (elevenLabsEnabled) {
      await playSequence();
    } else {
      // Fallback para Web Speech API (notícias comuns)
      await playWithWebSpeech();
    }
  };

  // Efeito para reproduzir ElevenLabs quando URL estiver pronta
  useEffect(() => {
    if (elevenLabsUrl && currentPhase === 'tts') {
      playElevenLabsAudio(elevenLabsUrl);
    }
  }, [elevenLabsUrl, currentPhase]);

  // Limpar recursos
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (vinhetaRef.current) {
        vinhetaRef.current.pause();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLoading = elevenLabsLoading || isWebSpeechLoading;
  const isPlaying = isPlayingSequence || isWebSpeechPlaying;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6" data-e2e="smart-audio-player">
      <div className="flex items-center gap-3">
        <button 
          onClick={handlePlay}
          disabled={isLoading}
          data-e2e="audio-player-button"
          className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-sm"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
            </span>
            <span className="text-xs">
              {formatTime((progress / 100) * duration)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAudioPlayer;
