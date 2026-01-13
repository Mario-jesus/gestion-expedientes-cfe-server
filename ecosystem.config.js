module.exports = {
  apps: [{
    name: 'gestion-expedientes-cfe-server',
    script: './dist/server.js',
    cwd: './',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    // Configuración específica para Windows
    interpreter: 'node',
    kill_timeout: 5000
  }]
};
