import { Address, PublicKey } from 'shared/model/types';

export type IConstants = {
    AIRDROP: {
        ADDRESS: Address;
        STAKE_REWARD_PERCENT: number;
        REFERRAL_PERCENT_PER_LEVEL: Array<number>;
    };
    TOTAL_SUPPLY: {
        ADDRESS: Address;
        AMOUNT: number;
    };
    BLOCK_SLOT_WINDOW: number;
    ACTIVE_DELEGATES: Map<number, number>;
    MAX_VOTES: number;
    MAX_VOTES_PER_TRANSACTION: number;
    MAX_DELEGATE_USERNAME_LENGTH: number;
    EPOCH_TIME: number;
    FEES: {
        SEND: number;
        VOTE: number;
        SECOND_SIGNATURE: number;
        DELEGATE: number;
        FROZE: number;
        SEND_STAKE: number;
    };
    MAX_TRANSACTIONS_PER_BLOCK: number;
    REWARDS: {
        MILESTONES: Array<number>;
        DISTANCE: number;
    };
    SIGNATURE_LENGTH: number;
    FROZE: {
        VOTE_MILESTONE: number;
        REWARDS: {
            MILESTONES: Array<number>;
            DISTANCE: number;
        };
        REWARD_VOTE_COUNT: number;
        UNSTAKE_VOTE_COUNT: number;
    };
    TRANSFER: {
        MAX_TRS_RELAY: number;
        MAX_BLOCK_RELAY: number;
        REQUEST_BLOCK_LIMIT: number;
    };
    REFERRAL: {
        MAX_COUNT: number;
    };
    FORGING: {
        CURRENT_BLOCK_VERSION: number;
        SLOT_INTERVAL: number;
    };
    TRANSACTION_QUEUE_EXPIRE: number;
    TRANSACTION_TTL: number;
    PRE_ORDER_LAST_MIGRATED_BLOCK: number;
    PRE_ORDER_PUBLIC_KEY: string;
    PRE_ORDER_SECOND_PUBLIC_KEY: string;
    UPDATE_BLOCKCHAIN_INFO_INTERVAL: number;
    UPDATE_SYSTEM_INFO_INTERVAL: number;
    MAX_PEERS_CONNECT_TO: number;
    MAX_PEERS_CONNECTED: number
    PEERS_DISCOVER: {
        MAX: number;
        MIN: number;
    };
    TIMEOUT_START_SYNC_BLOCKS: number;
    TIMEOUT_START_PEER_REQUEST: number;
    PEER_CONNECTION_TIME_INTERVAL_REBOOT: {
        MIN: number;
        MAX: number;
    };
    PEER_PING_PONG_INTERVAL: number;
    PEERS_COUNT_FOR_DISCOVER: number;
    PRE_MINED_ACCOUNTS: Array<Address>;
    TIMEOUT_START_PEER_CONNECT: number;
    ADDRESSES_BLACKLIST: Set<Address>;
    THIEVES_ADDRESSES_BLACKLIST: Set<Address>;
    FRAUD_OPERATION_BLACKLIST: Set<Address>;
    START_FEATURE_BLOCK: {
        ACCOUNT_BLACKLIST: number;
        THIEVES_ACCOUNT_BLACKLIST: number;
        VOTE_WITH_ACTIVE_STAKE: number;
        FIX_TRANSACTION_IN_THE_PAST_BLOCK_HEIGHT: number;
        FRAUD_OPERATION_BLACKLIST: number;
    };
    CORE_REQUEST_TIMEOUT: number;
};
