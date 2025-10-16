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
  // Hook Azure TTS (usa voz padrão configurada no backend)
  const { enabled: elevenLabsEnabled, loading: elevenLabsLoading, url: elevenLabsUrl, onClick: generateElevenLabs, response: ttsResponse } = useTts(post);
  
  // Estados para Web Speech API (fallback/notícias comuns)
  const [isWebSpeechPlaying, setIsWebSpeechPlaying] = useState(false);
  const [isWebSpeechLoading, setIsWebSpeechLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Estados para sequência vinheta + Azure TTS
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'generating' | 'vinheta' | 'tts'>('idle');
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vinhetaRef = useRef<HTMLAudioElement | null>(null);

  // Escolher vinheta aleatória
  const getRandomVinheta = (): string => {
    const vinhetas = ['/audio/vinheta1.mp3', '/audio/vinheta2.mp3', '/audio/vinheta3.mp3'];
    return vinhetas[Math.floor(Math.random() * vinhetas.length)];
  };

  // Tocar sequência: vinheta + Google TTS (TODAS as notícias)
  const playSequence = async () => {
    setIsPlayingSequence(true);
    setCurrentPhase('generating');

    try {
      console.log('🎵 Gerando/buscando áudio Google TTS...');
      
      let audioUrl = elevenLabsUrl;
      
      if (!audioUrl) {
        await generateElevenLabs(); // Nome mantido mas agora gera com Google TTS
        // Aguardar estado atualizar
        await new Promise(resolve => setTimeout(resolve, 200));
        audioUrl = elevenLabsUrl;
        console.log('🔍 URL após geração:', audioUrl);
      }

      // Se temos URL, tocar com vinheta
      if (audioUrl) {
        setCurrentPhase('vinheta');
        const vinhetaUrl = getRandomVinheta();
        console.log('🎵 Tocando vinheta:', vinhetaUrl);
        
        vinhetaRef.current = new Audio(vinhetaUrl);
        vinhetaRef.current.volume = 0.8;
        
        vinhetaRef.current.onended = async () => {
          console.log('🎵 Vinheta terminada, iniciando TTS...');
          setCurrentPhase('tts');
          
          const finalUrl = elevenLabsUrl || audioUrl;
          console.log('🔍 URL final para reprodução:', finalUrl);
          
          if (finalUrl) {
            console.log('✅ Tocando Google TTS:', finalUrl);
            playElevenLabsAudio(finalUrl); // Nome mantido mas toca Google TTS
          } else {
            console.error('❌ ERRO: Sem URL de áudio!');
            console.error('Debug - elevenLabsUrl:', elevenLabsUrl);
            console.error('Debug - audioUrl:', audioUrl);
            console.error('Debug - ttsResponse:', ttsResponse);
            
            setIsPlayingSequence(false);
            setCurrentPhase('idle');
            console.warn('⚠️ Erro ao gerar áudio, tente novamente');
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

      } else {
        // Sem URL - NÃO cair em Web Speech se Azure TTS está configurado
        console.error('❌ Azure TTS não gerou áudio');
        setIsPlayingSequence(false);
        setCurrentPhase('idle');
        alert('Erro ao gerar áudio. Verifique se o Azure TTS está configurado no servidor.');
      }

    } catch (error) {
      console.error('❌ Erro ao processar TTS:', error);
      setIsPlayingSequence(false);
      setCurrentPhase('idle');
      console.warn('⚠️ Erro ao gerar/reproduzir áudio');
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
      // Limpar HTML e formatar para narração
      const cleanText = content
        .replace(/<[^>]*>/g, ' ')  // Remove tags HTML
        .replace(/&nbsp;/g, ' ')   // Remove &nbsp;
        .replace(/&amp;/g, '&')    // Converte entidades HTML
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove markdown bold
        .replace(/\*(.*?)\*/g, '$1')      // Remove markdown italic
        .replace(/#{1,6}\s*/g, '')        // Remove markdown headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove markdown links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')   // Remove markdown images
        .replace(/```[\s\S]*?```/g, '')   // Remove code blocks
        .replace(/`([^`]+)`/g, '$1')      // Remove inline code
        .replace(/\s+/g, ' ')             // Remove espaços extras
        .replace(/\n{3,}/g, '\n\n')       // Remove quebras excessivas
        .trim();

      const optimizedText = cleanText;

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
  
  // Mensagem de status
  const getStatusMessage = () => {
    if (currentPhase === 'generating') return 'Gerando áudio de alta qualidade...';
    if (currentPhase === 'vinheta') return 'Tocando vinheta...';
    if (currentPhase === 'tts' || isPlaying) return 'Reproduzindo...';
    if (isLoading) return 'Carregando...';
    return 'Clique para ouvir';
  };

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
              <span className="text-xs">{getStatusMessage()}</span>
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
