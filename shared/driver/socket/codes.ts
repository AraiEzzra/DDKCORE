
export const enum API_ACTION_TYPES {
    GET_ACCOUNT = 'GET_ACCOUNT',
    GET_ACCOUNT_BALANCE = 'GET_ACCOUNT_BALANCE',

    CREATE_STAKE_ASSET = 'CREATE_STAKE_ASSET',
    CREATE_VOTE_ASSET = 'CREATE_VOTE_ASSET',

    CREATE_TRANSACTION = 'CREATE_TRANSACTION',
    CREATE_PREPARED_TRANSACTION = 'CREATE_PREPARED_TRANSACTION',
    GET_TRANSACTION = 'GET_TRANSACTION',
    GET_TRANSACTIONS = 'GET_TRANSACTIONS',
    GET_TRANSACTIONS_BY_BLOCK_ID = 'GET_TRANSACTIONS_BY_BLOCK_ID',
    GET_TRANSACTIONS_BY_HEIGHT = 'GET_TRANSACTIONS_BY_HEIGHT',

    GET_BLOCK = 'GET_BLOCK',
    GET_BLOCKS = 'GET_BLOCKS',
    GET_BLOCK_BY_HEIGHT = 'GET_BLOCK_BY_HEIGHT',
    GET_LAST_BLOCK = 'GET_LAST_BLOCK',

    GET_DELEGATES = 'GET_DELEGATES',
    GET_ACTIVE_DELEGATES = 'GET_ACTIVE_DELEGATES',
    GET_MY_DELEGATES = 'GET_MY_DELEGATES',

    GET_REFERRED_USERS = 'GET_REFERRED_USERS',

    GET_AIRDROP_REWARD_HISTORY = 'GET_AIRDROP_REWARD_HISTORY',
    GET_AIRDROP_REWARD_DAILY_HISTORY = 'GET_AIRDROP_REWARD_DAILY_HISTORY',

    GET_REWARD_HISTORY = 'GET_REWARD_HISTORY',
    GET_REFERRED_USERS_REWARDS = 'GET_REFERRED_USERS_REWARDS',

    GET_STAKE_REWARDS = 'GET_STAKE_REWARDS',
    GET_AIRDROP_REWARDS = 'GET_AIRDROP_REWARDS',

    GET_CURRENT_ROUND = 'GET_CURRENT_ROUND',
    GET_CURRENT_ROUND_DELEGATES = 'GET_CURRENT_ROUND_DELEGATES',
    GET_ROUNDS = 'GET_ROUNDS',
    GET_ROUND = 'GET_ROUND',

    GET_ACCOUNT_HISTORY = 'GET_ACCOUNT_HISTORY',
    GET_TRANSACTION_HISTORY = 'GET_TRANSACTION_HISTORY',
    GET_BLOCK_HISTORY = 'GET_BLOCK_HISTORY',
    GET_ALL_UNCONFIRMED_TRANSACTIONS = 'GET_ALL_UNCONFIRMED_TRANSACTIONS',
}

export const enum EVENT_TYPES {
    APPLY_BLOCK = 'APPLY_BLOCK',
    UNDO_BLOCK = 'UNDO_BLOCK',
    DECLINE_TRANSACTION = 'DECLINE_TRANSACTION',
    TRANSACTION_CONFLICTED = 'TRANSACTION_CONFLICTED', // debug
    UPDATE_BLOCKCHAIN_INFO = 'UPDATE_BLOCKCHAIN_INFO',
    UPDATE_SYSTEM_INFO = 'UPDATE_SYSTEM_INFO',
    NEW_ROUND = 'NEW_ROUND',
}
