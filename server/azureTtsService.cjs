/**
 * Azure Text-to-Speech Service
 * Converte texto de matérias em áudio usando Azure Cognitive Services
 */

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const path = require('path');

class AzureTtsService {
  constructor() {
    // Não carregar variáveis no construtor, fazer lazy load
    this._speechKey = null;
    this._speechRegion = null;
    this._voiceName = null;
    this._initialized = false;
  }

  /**
   * Lazy load das configurações (carrega na primeira chamada)
   */
  _init() {
    if (this._initialized) return;
    
    this._speechKey = process.env.AZURE_SPEECH_KEY;
    this._speechRegion = process.env.AZURE_SPEECH_REGION || 'brazilsouth';
    this._voiceName = process.env.AZURE_SPEECH_VOICE || 'pt-BR-AntonioNeural';
    this._initialized = true;
    
    if (!this._speechKey) {
      console.warn('[Azure TTS] AZURE_SPEECH_KEY não configurada. TTS desabilitado.');
    }
  }

  get speechKey() {
    this._init();
    return this._speechKey;
  }

  get speechRegion() {
    this._init();
    return this._speechRegion;
  }

  get voiceName() {
    this._init();
    return this._voiceName;
  }

  /**
   * Verifica se o serviço está configurado
   */
  isConfigured() {
    this._init();
    return !!this._speechKey && !!this._speechRegion;
  }

  /**
   * Escapa caracteres especiais para XML/SSML
   * CRÍTICO: Previne SSML parsing errors
   * IMPORTANTE: Não escapar aspas pois elas são normalizadas antes e não quebram SSML em conteúdo de texto
   */
  escapeXml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')   // & deve ser primeiro!
      .replace(/</g, '&lt;')    // < pode indicar tag HTML
      .replace(/>/g, '&gt;');   // > pode indicar tag HTML
    // NÃO escapar " e ' pois cleanTextForSpeech já normaliza e eles não quebram SSML em text nodes
  }

  /**
   * Limpa o HTML e prepara o texto para narração com naturalidade
   */
  cleanTextForSpeech(htmlContent) {
    if (!htmlContent) return '';

    // Remove tags HTML
    let text = htmlContent.replace(/<[^>]*>/g, ' ');
    
    // ===== NORMALIZAÇÃO PARA NATURALIDADE =====
    
    // Expandir abreviações comuns
    text = text.replace(/\bR\$\s*(\d+)/g, '$1 reais'); // R$ 100 → 100 reais
    text = text.replace(/\bDr\./g, 'Doutor');
    text = text.replace(/\bDra\./g, 'Doutora');
    text = text.replace(/\bSr\./g, 'Senhor');
    text = text.replace(/\bSra\./g, 'Senhora');
    text = text.replace(/\bProf\./g, 'Professor');
    text = text.replace(/\bProfa\./g, 'Professora');
    
    // Siglas comuns do Piauí/Brasil (falar letra por letra)
    text = text.replace(/\bPM\b/g, 'Pê Eme'); // Polícia Militar
    text = text.replace(/\bPC\b/g, 'Pê Cê'); // Polícia Civil
    text = text.replace(/\bPRF\b/g, 'Pê Erre Efe'); // Polícia Rodoviária Federal
    text = text.replace(/\bUPA\b/g, 'U P A'); // Unidade de Pronto Atendimento
    text = text.replace(/\bUBS\b/g, 'U B S'); // Unidade Básica de Saúde
    text = text.replace(/\bCPF\b/g, 'Cê Pê Efe');
    text = text.replace(/\bRG\b/g, 'Erre Gê');
    text = text.replace(/\bCNH\b/g, 'Cê Ene Agá');
    text = text.replace(/\bSUS\b/g, 'S U S');
    text = text.replace(/\bMPPI\b/g, 'Eme Pê Pê I'); // Ministério Público do Piauí
    text = text.replace(/\bTJPI\b/g, 'Tê Jota Pê I'); // Tribunal de Justiça do Piauí
    text = text.replace(/\bPI\b/g, 'Piauí'); // Estado
    text = text.replace(/\bBR-(\d+)/g, 'B R $1'); // BR-343 → B R 343
    
    // Órgãos que devem ser falados por extenso
    text = text.replace(/\bIBGE\b/g, 'I B G E');
    text = text.replace(/\bINSS\b/g, 'I N S S');
    text = text.replace(/\bFGTS\b/g, 'Efe Gê Tê Esse');
    
    // Partidos políticos
    text = text.replace(/\bPT\b/g, 'Pê Tê');
    text = text.replace(/\bPSDB\b/g, 'Pê Esse Dê Bê');
    text = text.replace(/\bPL\b/g, 'Pê Éle');
    text = text.replace(/\bPDT\b/g, 'Pê Dê Tê');
    text = text.replace(/\bMDB\b/g, 'Eme Dê Bê');
    
    // Normalizar números de telefone
    text = text.replace(/\((\d{2})\)\s*(\d{4,5})-(\d{4})/g, (match, ddd, parte1, parte2) => {
      return `telefone ${ddd} ${parte1} ${parte2}`;
    });
    
    // Horários (15h30 → 15 horas e 30 minutos)
    text = text.replace(/(\d{1,2})h(\d{2})/g, '$1 horas e $2 minutos');
    text = text.replace(/(\d{1,2})h\b/g, '$1 horas');
    
    // Datas (01/01/2024 → 1 de janeiro de 2024)
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    text = text.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, dia, mes, ano) => {
      const mesNome = meses[parseInt(mes) - 1] || mes;
      return `${parseInt(dia)} de ${mesNome} de ${ano}`;
    });
    
    // Remove múltiplos espaços
    text = text.replace(/\s+/g, ' ');
    
    // Remove caracteres especiais problemáticos
    text = text.replace(/[""]/g, '"');
    text = text.replace(/['']/g, "'");
    
    // Melhorar pausas em pontuações (SSML vai controlar isso melhor)
    text = text.replace(/\.\s+/g, '. ');
    text = text.replace(/\?\s+/g, '? ');
    text = text.replace(/!\s+/g, '! ');
    text = text.replace(/,\s+/g, ', ');
    text = text.replace(/:\s+/g, ': ');
    
    return text.trim();
  }

  /**
   * Cria SSML (Speech Synthesis Markup Language) para melhor controle da narração
   */
  createSSML(text, titulo = '', voiceName = null) {
    const cleanText = this.cleanTextForSpeech(text);
    const cleanTitle = titulo ? this.cleanTextForSpeech(titulo) : '';
    const voice = voiceName || this.voiceName;
    
    // CRÍTICO: Escapar XML para prevenir SSML parsing errors
    const escapedText = this.escapeXml(cleanText);
    const escapedTitle = this.escapeXml(cleanTitle);
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">`;
    ssml += `<voice name="${voice}">`;
    
    // Adiciona título com ênfase se fornecido
    if (escapedTitle) {
      ssml += `<prosody rate="0.95" pitch="+3%" volume="+2dB">`;
      ssml += `<emphasis level="moderate">${escapedTitle}</emphasis>`;
      ssml += `</prosody>`;
      ssml += `<break time="1000ms"/>`; // Pausa de 1 segundo após título
    }
    
    // Adiciona o conteúdo com velocidade natural e pausas
    // Dividir em parágrafos para adicionar pausas entre eles
    // CRÍTICO: Usar escapedText que já tem XML entities escapadas
    const paragraphs = escapedText.split(/\n\n+/);
    
    paragraphs.forEach((para, index) => {
      if (!para.trim()) return;
      
      // Velocidade um pouco mais lenta para melhor compreensão
      ssml += `<prosody rate="0.95" pitch="0%" volume="medium">`;
      
      // Adicionar pausas em vírgulas e pontos
      // Nota: Para já está escapado (vem de escapedText)
      let paraWithPauses = para;
      paraWithPauses = paraWithPauses.replace(/,\s+/g, ',<break time="300ms"/> ');
      paraWithPauses = paraWithPauses.replace(/\.\s+/g, '.<break time="500ms"/> ');
      paraWithPauses = paraWithPauses.replace(/!\s+/g, '!<break time="600ms"/> ');
      paraWithPauses = paraWithPauses.replace(/\?\s+/g, '?<break time="600ms"/> ');
      paraWithPauses = paraWithPauses.replace(/:\s+/g, ':<break time="400ms"/> ');
      
      ssml += paraWithPauses;
      ssml += `</prosody>`;
      
      // Pausa entre parágrafos
      if (index < paragraphs.length - 1) {
        ssml += `<break time="800ms"/>`;
      }
    });
    
    ssml += `</voice>`;
    ssml += `</speak>`;
    
    return ssml;
  }

  /**
   * Gera áudio a partir de texto
   * @param {string} text - Texto a ser convertido (pode ser HTML)
   * @param {string} outputPath - Caminho completo do arquivo de saída (.mp3)
   * @param {object} options - Opções adicionais
   * @returns {Promise<{success: boolean, filePath?: string, duration?: number, error?: string}>}
   */
  async generateAudio(text, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConfigured()) {
        return reject(new Error('Azure TTS não configurado. Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION.'));
      }

      try {
        // Configurar Speech SDK
        const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
        
        // Configurar formato de saída (MP3)
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        
        // Usar voz customizada se fornecida, senão usar padrão
        const voiceToUse = options.voiceName || this.voiceName;
        
        // Criar diretório se não existir
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Configurar saída de áudio para arquivo
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath);
        
        // Criar sintetizador
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        
        // Criar SSML com voz customizada
        const ssml = this.createSSML(text, options.titulo, voiceToUse);
        
        console.log(`[Azure TTS] Gerando áudio: ${path.basename(outputPath)}`);
        console.log(`[Azure TTS] Tamanho do texto: ${text.length} caracteres`);
        console.log(`[Azure TTS] 🔍 SSML Gerado (primeiros 500 chars):`, ssml.substring(0, 500));
        
        // Sintetizar
        synthesizer.speakSsmlAsync(
          ssml,
          result => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              const duration = result.audioDuration / 10000000; // Convert to seconds
              console.log(`[Azure TTS] ✅ Áudio gerado com sucesso: ${duration.toFixed(2)}s`);
              
              synthesizer.close();
              resolve({
                success: true,
                filePath: outputPath,
                duration: duration,
                fileSize: fs.statSync(outputPath).size
              });
            } else {
              console.error(`[Azure TTS] ❌ Erro na síntese: ${result.errorDetails}`);
              synthesizer.close();
              reject(new Error(`Falha na síntese: ${result.errorDetails}`));
            }
          },
          error => {
            console.error(`[Azure TTS] ❌ Erro: ${error}`);
            synthesizer.close();
            reject(error);
          }
        );
      } catch (error) {
        console.error(`[Azure TTS] ❌ Exceção:`, error);
        reject(error);
      }
    });
  }

  /**
   * Gera áudio para uma matéria completa
   * @param {object} post - Objeto da matéria com titulo, subtitulo, conteudo
   * @param {string} outputDir - Diretório onde salvar o áudio
   * @returns {Promise<object>} Informações do áudio gerado
   */
  async generatePostAudio(post, outputDir = './uploads/audio') {
    if (!this.isConfigured()) {
      throw new Error('Azure TTS não configurado');
    }

    // Montar texto completo para narração
    let fullText = '';
    
    // NÃO adicionar título aqui - ele é passado separadamente para o SSML
    // O SSML já coloca o título com ênfase e pausa
    
    if (post.subtitulo) {
      fullText += post.subtitulo + '. ';
    }
    
    if (post.conteudo) {
      fullText += post.conteudo;
    }

    // Gerar nome do arquivo
    const filename = `post-${post.id}-${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, filename);

    // Gerar áudio (título vai no SSML com ênfase)
    const result = await this.generateAudio(fullText, outputPath, {
      titulo: post.titulo
    });

    return {
      ...result,
      relativeUrl: `/uploads/audio/${filename}`,
      postId: post.id
    };
  }

  /**
   * Lista vozes disponíveis para a região configurada
   */
  async listAvailableVoices() {
    return new Promise((resolve, reject) => {
      if (!this.isConfigured()) {
        return reject(new Error('Azure TTS não configurado'));
      }

      const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

      synthesizer.getVoicesAsync(
        result => {
          if (result.reason === sdk.ResultReason.VoicesListRetrieved) {
            // Filtrar apenas vozes em português do Brasil
            const ptBRVoices = result.voices
              .filter(voice => voice.locale.startsWith('pt-BR'))
              .map(voice => ({
                name: voice.name,
                displayName: voice.localName,
                gender: voice.gender === 1 ? 'Masculino' : 'Feminino',
                locale: voice.locale
              }));
            
            synthesizer.close();
            resolve(ptBRVoices);
          } else {
            synthesizer.close();
            reject(new Error('Falha ao listar vozes'));
          }
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });
  }
}

// Exportar instância singleton
module.exports = new AzureTtsService();
