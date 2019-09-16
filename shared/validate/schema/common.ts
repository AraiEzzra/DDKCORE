import { TransactionType } from 'shared/model/transaction';
import config from 'shared/config';

export const ALLOWED_TRANSACTION_TYPES_ARRAY = [
    TransactionType.REGISTER,
    TransactionType.SEND,
    TransactionType.SIGNATURE,
    TransactionType.DELEGATE,
    TransactionType.STAKE,
    TransactionType.VOTE
];

export const PAGINATION_SCHEME = {
    limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100
    },
    offset: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
    }
};

export const DEFAULT_LIMIT_SCHEMA = {
    type: 'integer',
    minimum: 1,
    maximum: 100
};

export const TRANSACTIONS_LIMIT_SCHEMA = {
    type: 'integer',
    minimum: 1,
    maximum: config.CONSTANTS.MAX_TRANSACTIONS_PER_BLOCK,
};

export const DEFAULT_OFFSET_SCHEMA = {
    type: 'integer',
    minimum: 0,
    maximum: 1000,
};
