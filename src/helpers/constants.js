const env = process.env;
const constants = {
  PREVIOUS_DELEGATES_COUNT: 3,
  MASTER_NODE_MIGRATED_BLOCK: 0
};

Object.assign(constants, require('../config/env'));


// console.log('ENVIRONMENT:', env);
// console.log('CONSTANTS FIRST:', constants);

if(env.NODE_ENV === 'development') {
    console.log('development')
    Object.assign(constants, require('../config/default/constants'));
}

// For staging environment
if(env.NODE_ENV === 'testnet') {
    console.log('testnet')
    Object.assign(constants, require('../config/testnet/constants'));
}

// For production
if(env.NODE_ENV === 'mainnet') {
    console.log('mainnet')
    Object.assign(constants, require('../config/mainnet/constants'));
}

module.exports = constants;
