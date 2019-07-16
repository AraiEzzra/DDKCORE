import { TransactionType } from 'shared/model/transaction';

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
