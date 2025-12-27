/**
 * PM2 Ecosystem Configuration
 * For production deployment on EC2
 */

module.exports = {
  apps: [
    {
      name: 'titan-playground',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/titan-playground',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/titan-playground/logs/error.log',
      out_file: '/var/www/titan-playground/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
