/**
 * pm2配置
 */
module.exports = {
  apps : [{
    name: 'nodejs_helloworld',
    script: './index.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'one two',
    instances: 4,
    autorestart: false,
    watch: true,
    output: './server/logs/out.log', // 显示console.log
    error: './server/logs/error.log',
    ignore_watch : ['node_modules', './server/logs'],
    log_type: 'json',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development' // pm2 start ecosystem.config.js
    },
    env_production: {
      NODE_ENV: 'production' // pm2 start ecosystem.config.js --env production
    }
  }]
};
