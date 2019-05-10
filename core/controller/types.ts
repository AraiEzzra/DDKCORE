import { IAsset, TransactionModel } from 'shared/model/transaction';

export type CreateTransactionParams = { trs: TransactionModel<IAsset>, secret: string, secondSecret?: string };
