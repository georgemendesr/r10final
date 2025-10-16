/**
 * Rotas de Configurações do Sistema
 * Gerencia configurações globais como voz do TTS, etc.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Arquivo de configurações (JSON)
const CONFIG_FILE = path.join(__dirname, '../config/settings.json');

// Garantir que o diretório de config existe
const configDir = path.dirname(CONFIG_FILE);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Configurações padrão
const DEFAULT_SETTINGS = {
  tts: {
    voiceName: 'pt-BR-AntonioNeural',
    enabled: true
  }
};

// Função para ler configurações
function readSettings() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[Settings] Erro ao ler configurações:', error);
    return DEFAULT_SETTINGS;
  }
}

// Função para salvar configurações
function saveSettings(settings) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Settings] Erro ao salvar configurações:', error);
    return false;
  }
}

// Middleware simples de autenticação (adapte conforme seu sistema)
const authMiddleware = (req, res, next) => {
  // Por enquanto, permitir acesso
  // TODO: Implementar verificação de token/sessão
  next();
};

/**
 * GET /api/settings/tts
 * Retorna configurações de TTS
 */
router.get('/tts', authMiddleware, (req, res) => {
  try {
    const settings = readSettings();
    res.json({
      success: true,
      ...settings.tts
    });
  } catch (error) {
    console.error('[Settings API] Erro ao buscar config TTS:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

/**
 * POST /api/settings/tts
 * Atualiza configurações de TTS
 */
router.post('/tts', authMiddleware, (req, res) => {
  try {
    const { voiceName, enabled } = req.body;

    // Validar voiceName
    const validVoices = [
      'pt-BR-AntonioNeural',
      'pt-BR-FranciscaNeural',
      'pt-BR-BrendaNeural',
      'pt-BR-DonatoNeural',
      'pt-BR-ElzaNeural',
      'pt-BR-FabioNeural',
      'pt-BR-GiovannaNeural',
      'pt-BR-HumbertoNeural',
      'pt-BR-JulioNeural',
      'pt-BR-LeilaNeural',
      'pt-BR-LeticiaNeural',
      'pt-BR-ManuelaNeural',
      'pt-BR-NicolauNeural',
      'pt-BR-ThalitaNeural',
      'pt-BR-ValerioNeural',
      'pt-BR-YaraNeural'
    ];

    if (voiceName && !validVoices.includes(voiceName)) {
      return res.status(400).json({ 
        error: 'Voz inválida',
        validVoices 
      });
    }

    // Ler configurações atuais
    const settings = readSettings();

    // Atualizar apenas os campos fornecidos
    if (voiceName !== undefined) {
      settings.tts.voiceName = voiceName;
    }
    if (enabled !== undefined) {
      settings.tts.enabled = enabled;
    }

    // Salvar
    const saved = saveSettings(settings);

    if (saved) {
      // Atualizar variável de ambiente para sessão atual
      process.env.AZURE_SPEECH_VOICE = settings.tts.voiceName;

      res.json({
        success: true,
        message: 'Configurações atualizadas com sucesso',
        settings: settings.tts
      });
    } else {
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }

  } catch (error) {
    console.error('[Settings API] Erro ao atualizar config TTS:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

/**
 * GET /api/settings
 * Retorna todas as configurações
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const settings = readSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[Settings API] Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

module.exports = router;
