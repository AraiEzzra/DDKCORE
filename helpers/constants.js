const env = process.env;
const constants = {
  // Block verify
  VERIFY_BLOCK_VERSION: true,
  VERIFY_BLOCK_SIGNATURE: true,
  VERIFY_BLOCK_ID: true,
  VERIFY_BLOCK_PAYLOAD: true,
  VERIFY_INVALID_BLOCK_TIMESTAMP: true,
  VERIFY_PREVIOUS_BLOCK: true,
  VERIFY_AGAINST_LAST_N_BLOCK_IDS: true,
  VERIFY_BLOCK_FORK_ONE: true,
  VERIFY_BLOCK_REWARD: true,
  VERIFY_BLOCK_SLOT: true,
  VERIFY_BLOCK_SLOT_WINDOW: true,
  VALIDATE_BLOCK_SLOT: true,

  // Delegates transaction verify
  VERIFY_DELEGATE_TRS_RECIPIENT: true,
  VERIFY_DELEGATE_TRS_AMOUNT: true,
  VERIFY_DELEGATE_TRS_IS_DELEGATE: true,
  VERIFY_DELEGATE_TRS_U_IS_DELEGATE: true,
  VERIFY_DELEGATE_TRS_ASSET: true,
  VERIFY_DELEGATE_USERNAME: true,
  VERIFY_DELEGATE_USERNAME_LOWERCASE: true,
  VERIFY_DELEGATE_EMPTY_USERNAME: true,
  VERIFY_DELEGATE_USERNAME_LENGTH: true,
  VERIFY_DELEGATE_USERNAME_ALPHANUMERIC_CHARACTERS: true,


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
    TRANSACTION_VALIDATION_ENABLED: {
        SENDER: true,
        TYPE: true,
        SECOND_SIGNATURE: true,
        SENDER_SECOND_SIGNATURE: true,
        REQUEST_SECOND_SIGNATURE: true,
        CHECKING_REQUEST_SECOND_SIGNATURE: true,
        SENDER_PUBLIC_KEY: true,
        SENDER_GENESIS_ACCOUNT: true,
        SENDER_ADDRESS: true,
        KEYSGROUP_MEMBER: true,
        MULTISIGNATURE_GROUP: true,
        VERIFY_TRANSACTION_SIGNATURE: true,
        VERIFY_TRANSACTION_SECOND_SIGNATURE: true,
        VERIFY_TRANSACTION_SIGNATURE_UNIQUE: true,
        VERIFY_TRANSACTION_MULTISIGNATURE: true,
        VERIFY_TRANSACTION_FEE: true,
        VERIFY_TRANSACTION_AMOUNT: true,
        VERIFY_SENDER_BALANCE: true,
        VERIFY_TRANSACTION_TIMESTAMP: true,
        VERIFY_TRANSACTION_TYPE: true,
        VERIFY_TRANSACTION_CONFIRMED: true,
    },
    STAKE_VALIDATE: {
        AMOUNT_ENABLED: true,
        BALANCE_ENABLED: true,
        AIRDROP_ENABLED: true,
    }
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
