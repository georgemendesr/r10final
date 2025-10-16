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
   * Limpa o HTML e prepara o texto para narração
   */
  cleanTextForSpeech(htmlContent) {
    if (!htmlContent) return '';

    // Remove tags HTML
    let text = htmlContent.replace(/<[^>]*>/g, ' ');
    
    // Remove múltiplos espaços
    text = text.replace(/\s+/g, ' ');
    
    // Remove caracteres especiais problemáticos
    text = text.replace(/[""]/g, '"');
    text = text.replace(/['']/g, "'");
    
    // Adiciona pausas em pontuações
    text = text.replace(/\./g, '. ');
    text = text.replace(/\?/g, '? ');
    text = text.replace(/!/g, '! ');
    
    return text.trim();
  }

  /**
   * Cria SSML (Speech Synthesis Markup Language) para melhor controle da narração
   */
  createSSML(text, titulo = '') {
    const cleanText = this.cleanTextForSpeech(text);
    const cleanTitle = titulo ? this.cleanTextForSpeech(titulo) : '';
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">`;
    ssml += `<voice name="${this.voiceName}">`;
    
    // Adiciona título com ênfase se fornecido
    if (cleanTitle) {
      ssml += `<prosody rate="0.9" pitch="+5%">`;
      ssml += `<emphasis level="strong">${cleanTitle}</emphasis>`;
      ssml += `</prosody>`;
      ssml += `<break time="800ms"/>`;
    }
    
    // Adiciona o conteúdo com velocidade natural
    ssml += `<prosody rate="1.0" pitch="0%">`;
    ssml += cleanText;
    ssml += `</prosody>`;
    
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
        
        // Criar diretório se não existir
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Configurar saída de áudio para arquivo
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath);
        
        // Criar sintetizador
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        
        // Criar SSML
        const ssml = this.createSSML(text, options.titulo);
        
        console.log(`[Azure TTS] Gerando áudio: ${path.basename(outputPath)}`);
        console.log(`[Azure TTS] Tamanho do texto: ${text.length} caracteres`);
        
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
    
    if (post.titulo) {
      fullText += post.titulo + '. ';
    }
    
    if (post.subtitulo) {
      fullText += post.subtitulo + '. ';
    }
    
    if (post.conteudo) {
      fullText += post.conteudo;
    }

    // Gerar nome do arquivo
    const filename = `post-${post.id}-${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, filename);

    // Gerar áudio
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
