const env = process.env;
const constants = {
    PREVIOUS_DELEGATES_COUNT: 3,
    MASTER_NODE_MIGRATED_BLOCK: 0,
    CURRENT_BLOCK_VERSION: 1,
    VOTE_VALIDATION_ENABLED: {
        INVALID_RECIPIENT: true,
        INVALID_TRANSACTION_ASSET: true,
        INVALID_VOTES_MUST_BE_ARRAY: true,
        INVALID_VOTES_EMPTY_ARRAY: true,
        VOTING_LIMIT_EXCEEDED: true,
        INVALID_VOTE_AT_INDEX: true,
        MULTIPLE_VOTES_FOR_SAME_DELEGATE: true,
        VOTE_REWARD_CORRUPTED: true,
        VOTE_UNSTAKE_CORRUPTED: true,
        PAYLOAD_HASH: true,
    },
    SEND_TRANSACTION_VALIDATION_ENABLED: {
        AMOUNT: true,
        RECIPIENT_ID: true
    },
    REFERRAL_TRANSACTION_VALIDATION_ENABLED: {
        GLOBAL_ACCOUNT: true
    },
    SIGNATURE_TRANSACTION_VALIDATION_ENABLED: {
        SIGNATURE: true,
        AMOUNT: true,
        PUBLIC_KEY: true
    },
};

Object.assign(constants, require('../config/env'));

if (env.NODE_ENV === 'development') {
    Object.assign(constants, require('../config/default/constants'));
}

// For staging environment
if (env.NODE_ENV === 'testnet') {
    Object.assign(constants, require('../config/testnet/constants'));
}

// For production
if (env.NODE_ENV === 'mainnet') {
    Object.assign(constants, require('../config/mainnet/constants'));
}

module.exports = constants;
