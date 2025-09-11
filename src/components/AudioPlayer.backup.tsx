import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  content: string;
}

interface TTSEngine {
  name: string;
  available: boolean;
  speak: (text: string, options: TTSOptions) => Promise<void>;
}

interface TTSOptions {
  voice: string;
  rate: number;
  pitch: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentEngine] = useState<string>('web-speech-api');
  const [selectedVoice] = useState<string>('pt-BR-AntonioNeural'); // Voz fixa - Antonio
  const [playbackRate] = useState<number>(1.0); // Velocidade fixa
  const [useIntroOutro] = useState<boolean>(true); // Sempre com intro/outro
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Áudios pré-gravados para economia
  const INTRO_AUDIO_URL = '/audio/intro-r10.mp3';
  const OUTRO_AUDIO_URL = '/audio/outro-r10.mp3';

  // Limite gratuito Azure: 500.000 caracteres/mês
  const AZURE_FREE_LIMIT = 500000;

  // Configuração das engines TTS (Web Speech otimizada como principal)
  const ttsEngines: TTSEngine[] = [
    {
      name: 'Web Speech API',
      available: 'speechSynthesis' in window,
      speak: speakWithWebAPI
    }
  ];

  useEffect(() => {
    // Carregar uso mensal do localStorage
    const storedUsage = localStorage.getItem('azure-monthly-usage');
    const currentMonth = new Date().getMonth();
    const storedMonth = localStorage.getItem('azure-usage-month');
    
    if (storedMonth && parseInt(storedMonth) !== currentMonth) {
      // Novo mês, resetar contador
      localStorage.setItem('azure-monthly-usage', '0');
      localStorage.setItem('azure-usage-month', currentMonth.toString());
      setMonthlyUsage(0);
    } else if (storedUsage) {
      setMonthlyUsage(parseInt(storedUsage));
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [content]);

  // Função para concatenar áudios
  async function concatenateAudios(audioBuffers: AudioBuffer[]): Promise<AudioBuffer> {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const numberOfChannels = audioBuffers[0].numberOfChannels;
    const sampleRate = audioBuffers[0].sampleRate;

    const concatenatedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

    let offset = 0;
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        concatenatedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
      }
      offset += buffer.length;
    }

    return concatenatedBuffer;
  }

  // Carregar áudio pré-gravado
  async function loadPrerecordedAudio(url: string): Promise<AudioBuffer | null> {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const response = await fetch(url);
      if (!response.ok) return null;
      
      const arrayBuffer = await response.arrayBuffer();
      return await audioContextRef.current.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn(`Erro ao carregar áudio pré-gravado: ${url}`, error);
      return null;
    }
  }

  // Azure Speech Service (GRATUITO - 500k chars/mês)
  async function speakWithAzure(text: string, options: TTSOptions): Promise<void> {
    try {
      // Otimizar texto para economia
      const optimizedText = optimizeTextForTTS(text);
      const textLength = optimizedText.length;
      
      console.log(`🆓 Azure Speech - Tentando usar voz: ${options.voice} - Caracteres: ${textLength}`);
      
      // Verificar limite gratuito
      if (monthlyUsage + textLength > AZURE_FREE_LIMIT) {
        console.warn('Limite gratuito Azure atingido, usando Web Speech API');
        await speakWithWebAPI(text, options);
        return;
      }

      // Usar Azure Speech Service gratuito via browser
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
          <voice name="${options.voice}">
            <prosody rate="${options.rate * 100}%" pitch="${options.pitch > 1 ? '+10%' : '-10%'}">
              ${escapeXml(optimizedText)}
            </prosody>
          </voice>
        </speak>
      `;

      console.log('🔄 Azure: Enviando request para endpoint...');

      // Usar endpoint público do Azure (região Brasil Sul)
      const response = await fetch('https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'R10PiauiTTS/1.0'
        },
        body: ssml
      });

      console.log(`📡 Azure Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`Azure TTS error: ${response.status} - ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      
      // Atualizar contador de uso
      const newUsage = monthlyUsage + textLength;
      setMonthlyUsage(newUsage);
      localStorage.setItem('azure-monthly-usage', newUsage.toString());
      
      if (useIntroOutro) {
        await playWithIntroOutro(audioBlob, options);
      } else {
        await playAudioBlob(audioBlob, options);
      }
      
    } catch (error) {
      console.warn('Azure TTS failed, falling back to Web Speech API:', error);
      await speakWithWebAPI(text, options);
    }
  }

  // Otimizar texto para TTS (remover elementos desnecessários)
  function optimizeTextForTTS(text: string): string {
    return text
      // Remover URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remover emails
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      // Remover hashtags e mentions
      .replace(/#\w+/g, '').replace(/@\w+/g, '')
      // Remover números de telefone
      .replace(/\(\d{2}\)\s?\d{4,5}-?\d{4}/g, '')
      // Limpar espaços extras
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Reproduzir com intro e outro
  async function playWithIntroOutro(contentBlob: Blob, options: TTSOptions): Promise<void> {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const audioBuffers: AudioBuffer[] = [];

      // Carregar intro (se disponível)
      const introBuffer = await loadPrerecordedAudio(INTRO_AUDIO_URL);
      if (introBuffer) audioBuffers.push(introBuffer);

      // Converter conteúdo gerado para AudioBuffer
      const contentArrayBuffer = await contentBlob.arrayBuffer();
      const contentBuffer = await audioContext.decodeAudioData(contentArrayBuffer);
      audioBuffers.push(contentBuffer);

      // Carregar outro (se disponível)
      const outroBuffer = await loadPrerecordedAudio(OUTRO_AUDIO_URL);
      if (outroBuffer) audioBuffers.push(outroBuffer);

      // Concatenar todos os áudios
      const finalBuffer = await concatenateAudios(audioBuffers);
      
      // Criar URL do áudio final
      const wavBlob = await audioBufferToWav(finalBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        options.onStart?.();
      };
      
      audio.onended = () => {
        options.onEnd?.();
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        options.onError?.();
        URL.revokeObjectURL(audioUrl);
      };

      audio.playbackRate = options.rate;
      await audio.play();

    } catch (error) {
      console.warn('Erro na concatenação, reproduzindo apenas conteúdo:', error);
      await playAudioBlob(contentBlob, options);
    }
  }

  // Reproduzir apenas o blob de áudio
  async function playAudioBlob(blob: Blob, options: TTSOptions): Promise<void> {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      options.onStart?.();
    };
    
    audio.onended = () => {
      options.onEnd?.();
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.onerror = () => {
      options.onError?.();
      URL.revokeObjectURL(audioUrl);
    };

    audio.playbackRate = options.rate;
    await audio.play();
  }

  // Converter AudioBuffer para WAV
  async function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // Amazon Polly via SDK - Qualidade Premium Gratuita (5M chars/mês)
  async function speakWithPolly(text: string, options: TTSOptions): Promise<void> {
    try {
      // Verificar se AWS SDK está disponível
      if (typeof (window as any).AWS === 'undefined') {
        console.warn('AWS SDK não disponível, carregando...');
        await loadAWSSDK();
      }

      // Otimizar texto para economia
      const optimizedText = optimizeTextForTTS(text);
      const textLength = optimizedText.length;
      
      console.log(`🎙️ Amazon Polly - Usando voz Ricardo Neural - Caracteres: ${textLength}`);
      
      // Configurar AWS (usando credenciais temporárias/demo)
      const AWS = (window as any).AWS;
      AWS.config.update({
        region: 'us-east-1',
        accessKeyId: 'demo', // Placeholder - será substituído por credenciais reais
        secretAccessKey: 'demo'
      });

      const polly = new AWS.Polly();
      
      const params = {
        Text: optimizedText,
        OutputFormat: 'mp3',
        VoiceId: 'Ricardo', // Voz masculina brasileira neural
        Engine: 'neural',
        LanguageCode: 'pt-BR',
        SampleRate: '22050'
      };

      // Como não temos credenciais reais, vamos simular e cair no fallback
      throw new Error('AWS credentials needed - falling back to ResponsiveVoice');
      
    } catch (error) {
      console.warn('❌ Amazon Polly needs credentials, using ResponsiveVoice:', error);
      await speakWithResponsiveVoice(text, options);
    }
  }

  // Carregar AWS SDK dinamicamente
  async function loadAWSSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).AWS !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.amazonaws.com/js/aws-sdk-2.1.24.min.js';
      script.onload = () => {
        console.log('✅ AWS SDK carregado com sucesso');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Erro ao carregar AWS SDK');
        reject(new Error('Failed to load AWS SDK'));
      };
      document.head.appendChild(script);
    });
  }

  // ResponsiveVoice - Backup de qualidade gratuita
  async function speakWithResponsiveVoice(text: string, options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se ResponsiveVoice está disponível
      if (typeof (window as any).responsiveVoice === 'undefined') {
        console.warn('ResponsiveVoice não disponível, carregando...');
        loadResponsiveVoice().then(() => {
          speakWithResponsiveVoiceInternal(text, options, resolve, reject);
        }).catch(() => {
          console.warn('Falha ao carregar ResponsiveVoice, usando Web Speech API');
          speakWithWebAPI(text, options).then(resolve).catch(reject);
        });
      } else {
        speakWithResponsiveVoiceInternal(text, options, resolve, reject);
      }
    });
  }

  // Carregar ResponsiveVoice dinamicamente
  async function loadResponsiveVoice(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).responsiveVoice !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=FREE';
      script.onload = () => {
        console.log('✅ ResponsiveVoice carregado com sucesso');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Erro ao carregar ResponsiveVoice');
        reject(new Error('Failed to load ResponsiveVoice'));
      };
      document.head.appendChild(script);
    });
  }

  // Função interna do ResponsiveVoice
  function speakWithResponsiveVoiceInternal(
    text: string, 
    options: TTSOptions, 
    resolve: () => void, 
    reject: (error: Error) => void
  ) {
    const rv = (window as any).responsiveVoice;
    
    // Otimizar texto
    const optimizedText = optimizeTextForTTS(text);
    
    // Usar voz masculina brasileira de melhor qualidade
    const voiceName = 'Brazilian Portuguese Male';
    
    console.log(`🎙️ ResponsiveVoice: Usando voz ${voiceName}`);
    
    try {
      options.onStart?.();
      
      rv.speak(optimizedText, voiceName, {
        rate: options.rate,
        pitch: options.pitch,
        volume: 0.9,
        onstart: () => {
          console.log('🔊 ResponsiveVoice: Iniciando reprodução');
        },
        onend: () => {
          console.log('✅ ResponsiveVoice: Reprodução finalizada');
          options.onEnd?.();
          resolve();
        },
        onerror: (error: any) => {
          console.error('❌ ResponsiveVoice: Erro na reprodução', error);
          options.onError?.();
          reject(new Error('ResponsiveVoice playback failed'));
        }
      });
    } catch (error) {
      console.error('❌ ResponsiveVoice: Erro geral', error);
      options.onError?.();
      reject(error as Error);
    }
  }

  // Web Speech API SIMPLES e DIRETA
  async function speakWithWebAPI(text: string, options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      // Parar qualquer síntese anterior
        speechSynthesis.cancel();
      
      console.log('🎙️ Iniciando síntese de texto...');
      
      // Otimizar texto
      const optimizedText = optimizeTextForTTS(text);
      
      // Limitar tamanho do texto para evitar problemas
      const maxLength = 500;
      const finalText = optimizedText.length > maxLength 
        ? optimizedText.substring(0, maxLength) + "..."
        : optimizedText;

      console.log(`📝 Texto otimizado: ${finalText.length} caracteres`);

      const utterance = new SpeechSynthesisUtterance(finalText);
      
      // Configurações básicas
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9; // Velocidade fixa otimizada
      utterance.pitch = 1.0; // Pitch natural
      utterance.volume = 0.9;
      
      // Tentar encontrar uma voz portuguesa
      const voices = speechSynthesis.getVoices();
      const ptVoice = voices.find(voice => 
        voice.lang.includes('pt-BR') || 
        voice.lang.includes('pt') ||
        voice.name.toLowerCase().includes('portuguese')
      );
      
      if (ptVoice) {
        utterance.voice = ptVoice;
        console.log(`🔊 Usando voz: ${ptVoice.name}`);
      } else {
        console.log('🔊 Usando voz padrão do sistema');
      }
      
      let hasStarted = false;
      
      utterance.onstart = () => {
        if (!hasStarted) {
          hasStarted = true;
          console.log('✅ Síntese iniciada com sucesso');
          options.onStart?.();
          resolve();
        }
      };
        
        utterance.onend = () => {
        console.log('✅ Síntese finalizada');
        options.onEnd?.();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Erro na síntese:', event.error);
        options.onError?.();
        if (!hasStarted) {
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        }
        };
        
        utteranceRef.current = utterance;
      
      try {
        speechSynthesis.speak(utterance);
        console.log('🚀 Comando speak() executado');
      } catch (error) {
        console.error('❌ Erro ao executar speak():', error);
        options.onError?.();
        if (!hasStarted) {
          reject(error);
        }
      }
    });
  }

  function escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  const startProgressTracking = (estimatedDuration?: number) => {
    let trackingDuration = estimatedDuration;
    
    if (!trackingDuration) {
      const wordCount = content.split(' ').length;
      trackingDuration = (wordCount / (150 * playbackRate)) * 60;
    }
    
    setDuration(trackingDuration);
    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && currentEngine === 'azure-speech') {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        setProgress((currentTime / duration) * 100);
      } else {
        setProgress(prev => {
          const newProgress = prev + (100 / trackingDuration);
          return newProgress >= 100 ? 100 : newProgress;
        });
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(0);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      // Parar reprodução imediatamente
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsLoading(false);
      stopProgressTracking();
      return;
    }

    // Mostrar loading imediatamente
    setIsLoading(true);
    
    // Usar setTimeout para não bloquear a UI
    setTimeout(async () => {
      try {
        const maxLength = 4000;
        const truncatedContent = content.length > maxLength 
          ? content.substring(0, maxLength) + "..."
          : content;

        // Tentar usar ElevenLabs primeiro (se configurado)
        const elevenLabsApiKey = import.meta.env.VITE_ELEVEN_API_KEY || 'sua_chave_aqui';
        const elevenLabsVoiceId = import.meta.env.VITE_ELEVEN_VOICE_ID || 'seu_voice_id_aqui';
        
        console.log('🔍 Debug variáveis de ambiente:');
        console.log('Todas as variáveis VITE_:', import.meta.env);
        console.log('VITE_ELEVEN_API_KEY:', elevenLabsApiKey);
        console.log('VITE_ELEVEN_VOICE_ID:', elevenLabsVoiceId);
        console.log('Tipo API Key:', typeof elevenLabsApiKey);
        console.log('Tipo Voice ID:', typeof elevenLabsVoiceId);
        console.log('API Key length:', elevenLabsApiKey?.length);
        console.log('Voice ID length:', elevenLabsVoiceId?.length);
        
        if (elevenLabsApiKey && elevenLabsVoiceId && 
            elevenLabsApiKey !== 'sua_chave_api_aqui' && 
            elevenLabsVoiceId !== 'seu_voice_id_aqui' &&
            elevenLabsApiKey !== 'sua_chave_aqui' &&
            elevenLabsVoiceId !== 'seu_voice_id_aqui') {
          console.log('🎙️ Tentando usar ElevenLabs...');
          console.log('🔑 API Key:', elevenLabsApiKey ? 'Configurada' : 'Não configurada');
          console.log('🎤 Voice ID:', elevenLabsVoiceId ? 'Configurado' : 'Não configurado');
          
          try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
              method: 'POST',
              headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsApiKey
              },
              body: JSON.stringify({
                text: truncatedContent,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.5
                }
              })
            });

            if (response.ok) {
              const audioBlob = await response.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              
              audio.onloadedmetadata = () => {
                setDuration(audio.duration);
                setIsLoading(false);
                setIsPlaying(true);
                startProgressTracking(audio.duration);
              };
              
              audio.onended = () => {
                setIsPlaying(false);
                setIsLoading(false);
                stopProgressTracking();
                URL.revokeObjectURL(audioUrl);
              };
              
              audio.onerror = () => {
                setIsPlaying(false);
                setIsLoading(false);
                stopProgressTracking();
                URL.revokeObjectURL(audioUrl);
                console.warn('ElevenLabs falhou, usando fallback');
                // Fallback para Web Speech API
                speakWithWebAPI(truncatedContent, {
                  voice: selectedVoice,
                  rate: playbackRate,
                  pitch: 1,
                  onStart: () => {
                    setIsLoading(false);
                    setIsPlaying(true);
                    startProgressTracking();
                  },
                  onEnd: () => {
                    setIsPlaying(false);
                    setIsLoading(false);
                    stopProgressTracking();
                  },
                  onError: () => {
                    setIsPlaying(false);
                    setIsLoading(false);
                    stopProgressTracking();
                  }
                });
              };

              await audio.play();
              return;
            }
          } catch (error) {
            console.warn('ElevenLabs falhou, usando fallback:', error);
          }
        }

        // Fallback para Web Speech API
        const engine = ttsEngines.find(e => e.available);
        
        if (!engine) {
          console.error('Nenhuma engine de narração disponível');
          alert('Seu navegador não suporta síntese de voz.');
          setIsLoading(false);
          return;
        }
        
        console.log(`🎙️ Usando engine: ${engine.name}`);

        await engine.speak(truncatedContent, {
          voice: selectedVoice,
          rate: playbackRate,
          pitch: 1,
          onStart: () => {
            setIsLoading(false);
            setIsPlaying(true);
            startProgressTracking();
          },
          onEnd: () => {
            setIsPlaying(false);
            setIsLoading(false);
            stopProgressTracking();
          },
          onError: () => {
            setIsPlaying(false);
            setIsLoading(false);
            stopProgressTracking();
          }
        });
      } catch (error) {
        console.error('TTS Error:', error);
        setIsLoading(false);
      }
    }, 10); // Pequeno delay para permitir que a UI atualize
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6" data-e2e="audio-player">
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
              Ouvir matéria
            </span>
            <span className="text-xs">
              {formatTime((progress / 100) * duration)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;