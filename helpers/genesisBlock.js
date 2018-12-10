let env = process.env;
let genesisBlock = {};

if(env.NODE_ENV === 'development') {
    genesisBlock = require('../config/default/genesisBlock.json');
}

// For staging environment
if(env.NODE_ENV === 'testnet') {
    genesisBlock = require('../config/testnet/genesisBlock.json');
}

// For production
if(env.NODE_ENV === 'mainnet') {
    genesisBlock = require('../config/testnet/genesisBlock.json');
}

module.exports = genesisBlock;
