import { IAsset, TransactionType } from 'shared/model/transaction';
import { TransactionModel } from 'shared/model/transaction';

export type Filter = {
    offset: number,
    limit: number,
    sort?: string,
    type?: TransactionType
};

export interface ITransaction extends TransactionModel<IAsset> {
    blockHeight: number;
}
