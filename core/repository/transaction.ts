import { Transaction } from 'shared/model/transaction';Transaction
import { ITransactionRepository as ITransactionRepositoryShared } from 'shared/repository/transaction';

// wait declare by @Fisenko
declare class Account {
}

export interface ITransactionRepository<T extends Object> extends ITransactionRepositoryShared<T> {
    list(): Array<Transaction<T>>;
}
