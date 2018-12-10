let env = process.env;
let constants = {};

if(env.NODE_ENV === 'development') {
    constants = require('../config/default/constants');
}

// For staging environment
if(env.NODE_ENV === 'testnet') {
    constants = require('../config/testnet/constants');
}

// For production
if(env.NODE_ENV === 'mainnet') {
    constants = require('../config/testnet/constants');
}

module.exports = constants;
