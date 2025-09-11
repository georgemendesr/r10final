module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: './r10-front_full_07ago',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',
      autorestart: true
    },
    {
      name: 'backend',
      script: './server/server-api-simple.cjs',
      autorestart: true
    },
    {
      name: 'instagram',
      script: './server.js',
      autorestart: true
    }
  ]
}
