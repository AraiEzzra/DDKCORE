
export const enum API_ACTION_TYPES {
    GET_ACCOUNT = 'GET_ACCOUNT',
    GET_ACCOUNT_BALANCE = 'GET_ACCOUNT_BALANCE',

    CREATE_TRANSACTION = 'CREATE_TRANSACTION',
    CREATE_PREPARED_TRANSACTION = 'CREATE_PREPARED_TRANSACTION',
    GET_TRANSACTION = 'GET_TRANSACTION',
    GET_TRANSACTIONS = 'GET_TRANSACTIONS',
    GET_TRANSACTIONS_BY_BLOCK_ID = 'GET_TRANSACTIONS_BY_BLOCK_ID',

    GET_BLOCK = 'GET_BLOCK',
    GET_BLOCKS = 'GET_BLOCKS',

    GET_DELEGATES = 'GET_DELEGATES',
    GET_ACTIVE_DELEGATES = 'GET_ACTIVE_DELEGATES',
    GET_MY_DELEGATES = 'GET_MY_DELEGATES',

    GET_REFERRED_USERS= 'GET_REFERRED_USERS',
    GET_REFERRED_USERS_BY_LEVEL = 'GET_REFERRED_USERS_BY_LEVEL',

    GET_REWARD_HISTORY = 'GET_REWARD_HISTORY',
    GET_REFERRED_USERS_REWARDS = 'GET_REFERRED_USERS_REWARDS',

    GET_STAKE_REWARDS = 'GET_STAKE_REWARDS',
    GET_AIRDROP_REWARDS = 'GET_AIRDROP_REWARDS',

    GET_CURRENT_ROUND = 'GET_CURRENT_ROUND',
    GET_ROUNDS = 'GET_ROUNDS',
    GET_ROUND = 'GET_ROUND'
}

export const enum EVENT_TYPES {
    APPLY_BLOCK = 'APPLY_BLOCK',
    UNDO_BLOCK = 'UNDO_BLOCK',
    DECLINE_TRANSACTION = 'DECLINE_TRANSACTION',
    TRANSACTION_CONFLICTED = 'TRANSACTION_CONFLICTED', // debug
    UPDATE_BLOCKCHAIN_INFO = 'UPDATE_BLOCKCHAIN_INFO',
}
