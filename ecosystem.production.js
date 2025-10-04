// ========================================
// PM2 Config OTIMIZADO para PRODUÇÃO
// Integrator NODE ELITE (1GB RAM)
// ========================================

module.exports = {
  apps: [
    // ============ BACKEND API ============
    {
      name: 'r10-backend',
      script: './server/server-api-simple.cjs',
      instances: 1, // Single instance (SQLite é single-file)
      autorestart: true,
      watch: false, // Desabilitar watch em produção
      max_memory_restart: '400M', // Restart se passar de 400MB
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      // Restart estratégico em caso de crash
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // ============ INSTAGRAM PUBLISHER ============
    {
      name: 'r10-instagram',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // 500MB limite (Canvas + Sharp + Puppeteer)
      error_file: './logs/instagram-error.log',
      out_file: './logs/instagram-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        // Otimizações Canvas/Sharp
        CANVAS_MEM_LIMIT: '300',
        SHARP_CONCURRENCY: '1'
      },
      // CRÍTICO: Forçar garbage collection após cada card
      node_args: '--expose-gc --max-old-space-size=450',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // ============ TTS SERVER (se usado) ============
    {
      name: 'r10-tts',
      script: './server/simple-server.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: './logs/tts-error.log',
      out_file: './logs/tts-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
