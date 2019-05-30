import { IConstants } from 'shared/config/types';

/* tslint:disable:no-magic-numbers */
const constants: IConstants = {
    AIRDROP: {
        ADDRESS: BigInt('7897332094363171058'),
        STAKE_REWARD_PERCENT: 10,
        REFERRAL_PERCENT_PER_LEVEL: [5, 3, 2, 2, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.5],
    },
    TOTAL_SUPPLY: {
        ADDRESS: BigInt('4995063339468361088'),
        AMOUNT: 4500000000000000,
    },
    BLOCK_SLOT_WINDOW: 5,
    ACTIVE_DELEGATES: 60,
    MAX_VOTES: 11,
    MAX_VOTES_PER_TRANSACTION: 3,
    MAX_DELEGATE_USERNAME_LENGTH: 20,
    EPOCH_TIME: 1451667600000,
    FEES: {
        SEND: 0.01,
        VOTE: 0.01,
        SECOND_SIGNATURE: 1000000,
        DELEGATE: 1000000000,
        FROZE: 0.01,
        SEND_STAKE: 0.1,
    },
    MAX_TRANSACTIONS_PER_BLOCK: 250,
    REWARDS: {
        MILESTONES: [
            500000000, // Initial Reward
            400000000, // Milestone 1
            300000000, // Milestone 2
            200000000, // Milestone 3
            100000000  // Milestone 4
        ],
        DISTANCE: 3000000, // Distance between each milestone
    },
    SIGNATURE_LENGTH: 65,
    FROZE: {
        VOTE_MILESTONE: 10, // in seconds
        REWARDS: {
            MILESTONES: [
                10, // 10% For 0-6 months
                10, // 10% For 7-12 months
                10, // 8% For 13-18 months
                10, // 6% For 19-24 months
                10, // 4% For 25-30 months
                10  // 2% For 31 months and above
            ],
            DISTANCE: 30, // Distance between each milestone is 6 months
        },
        REWARD_VOTE_COUNT: 2,
        UNSTAKE_VOTE_COUNT: 4
    },
    TRANSFER: {
        MAX_TRS_RELAY: 4,
        MAX_BLOCK_RELAY: 3,
        REQUEST_BLOCK_LIMIT: 10,
    },
    REFERRAL: {
        MAX_COUNT: 15,
    },
    FORGING: {
        SLOT_INTERVAL: 10,
        CURRENT_BLOCK_VERSION: 1,
    },
    TRANSACTION_QUEUE_EXPIRE: 300,
    PRE_ORDER_LAST_MIGRATED_BLOCK: 0,
    PRE_ORDER_PUBLIC_KEY: 'd8299cb39f5dd81b6e999228e7ca0b4cf596ac33f7b9d0e36471ac657f0e844b',
    PRE_ORDER_SECOND_PUBLIC_KEY: 'a9e121acbf07a8140ed7388fe1e8a4b77bb9c7972bbca32725c6a8f1841db333',
    UPDATE_BLOCKCHAIN_INFO_INTERVAL: 60 * 1000,
    UPDATE_SYSTEM_INFO_INTERVAL: 1000,
    MAX_PEERS_CONNECT_TO: 30,
    MAX_PEERS_CONNECTED: 40,
    PEERS_DISCOVER: {
        MAX: 35,
        MIN: 12,
    },
    TIMEOUT_START_SYNC_BLOCKS: 20000,
    TIMEOUT_START_PEER_REQUEST: 10000,
    PEER_CONNECTION_TIME_INTERVAL_REBOOT: {
        MIN: 25 * 60 * 1000,
        MAX: 30 * 60 * 1000,
    },
    PEERS_COUNT_FOR_DISCOVER: 6,
    PRE_MINED_ACCOUNTS: [
        BigInt('7897332094363171058'),
        BigInt('3002421063889966908'),
        BigInt('933553974927686133'),
        BigInt('4995063339468361088')
    ],
    ADDRESSES_BLACKLIST: new Set([]),
    START_FEATURE_BLOCK: {
        ACCOUNT_BLACKLIST: 0
    },
};
/* tslint:enable */

export default constants;
