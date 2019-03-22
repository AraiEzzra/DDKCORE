import { IAsset, TransactionModel } from 'shared/model/transaction';

export type Filter = {
    limit: number,
    offset: number
};

export type CreateTransactionParams = { trs: TransactionModel<IAsset>, secret: string };

