const env = process.env;
const constants = {
  MASTER_NODE_MIGRATED_BLOCK: 723820,
  PREVIOUS_DELEGATES_COUNT: 3
};

if(env.NODE_ENV === 'development') {
    Object.assign(constants, require('../config/default/constants'));
}

// For staging environment
if(env.NODE_ENV === 'testnet') {
    Object.assign(constants, require('../config/testnet/constants'));
}

// For production
if(env.NODE_ENV === 'mainnet') {
    Object.assign(constants, require('../config/mainnet/constants'));
}

module.exports = constants;
