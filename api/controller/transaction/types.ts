import { IAsset, TransactionType } from 'shared/model/transaction';
import { TransactionModel } from 'shared/model/transaction';

export interface ITransaction extends TransactionModel<IAsset> {
    blockHeight: number;
}

export type reqGetTransactions = {
    limit: number;
    offset: number;
    sort?: string;
    type?: TransactionType;
};

export type resGetTransactions = {
    transactions: Array<ITransaction>;
    total_count: number;
};
