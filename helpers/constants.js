const env = process.env;
const constants = {
  PREVIOUS_DELEGATES_COUNT: 3,
  MASTER_NODE_MIGRATED_BLOCK: 0,
  CURRENT_BLOCK_VERSION: 1,
  STAKE_VALIDATE: {
    AMOUNT_ENABLED: true,
    BALANCE_ENABLED: true,
    AIRDROP_ENABLED: true,
  },
  REWARD_VALIDATE: {
    RECIPIENT_ID_ENABLED: true,
    TRANSACTION_AMOUNT_ENABLED: true,
    REWARD_PER_ENABLED: true,
  },
};

Object.assign(constants, require('../config/env'));

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
