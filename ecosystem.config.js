module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'DDK',
      script: './app.js',
      watch: true,
      env: {
        NODE_ENV: 'development',
      },
      env_mainnet : {
        NODE_ENV: 'mainnet'
     },
     env_testnet : {
        NODE_ENV : 'testnet'
     }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'node',
      host: '13.251.251.219',
      ref: 'origin/mainnet',
      repo: 'https://github.com/oodlestechnologies/DDKCoin',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    staging: {
      user: 'root',
      host: '159.65.139.248',
      ref: 'origin/master',
      repo: 'https://github.com/oodlestechnologies/DDKCoin',
      path: '/root/DDKCoin/',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
      env: {
        NODE_ENV: 'staging'
      }
    },
    dev: {
      user: 'node',
      host: '127.0.0.1',
      ref: 'origin/master',
      repo: 'https://github.com/oodlestechnologies/DDKCoin',
      path: '/home/hotam/project/DDKCoin/',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
      env: {
        NODE_ENV: 'dev'
      }
    }
  }
};
