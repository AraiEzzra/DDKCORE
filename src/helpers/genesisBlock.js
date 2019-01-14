const env = process.env;
let genesisBlock = {};

if (env.NODE_ENV_IN === 'development') {
    genesisBlock = require('../config/default/genesisBlock.json');
}

// For staging environment
if (env.NODE_ENV_IN === 'testnet') {
    genesisBlock = require('../config/testnet/genesisBlock.json');
}

// For production
if (env.NODE_ENV_IN === 'mainnet') {
    genesisBlock = require('../config/mainnet/genesisBlock.json');
}

module.exports = genesisBlock;
