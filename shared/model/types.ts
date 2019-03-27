import { IAsset, TransactionModel } from 'shared/model/transaction';
import { Address } from 'shared/model/account';

export type Filter = {
    limit: number,
    offset: number
};

export type CreateTransactionParams = { trs: TransactionModel<IAsset>, secret: string };

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
    ACTIVE_DELEGATES: number;
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
        MAX_RELAY: number;
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
    PRE_ORDER_LAST_MIGRATED_BLOCK: number;
    PRE_ORDER_PUBLIC_KEY: string;
    UPDATE_BLOCKCHAIN_INFO_INTERVAL: number;
};
