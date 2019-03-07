import {TransactionType} from 'shared/model/transaction';

export interface ITransactionRequest {
    limit: number;
    offset: number;
    sort?: string;
    type?: TransactionType;
}
