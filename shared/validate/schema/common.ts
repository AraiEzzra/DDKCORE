import { TransactionType } from 'shared/model/transaction';

export const ALLOWED_TRANSACTION_TYPES_ARRAY = [
    TransactionType.REGISTER,
    TransactionType.SEND,
    TransactionType.SIGNATURE,
    TransactionType.DELEGATE,
    TransactionType.STAKE,
    TransactionType.VOTE
];
