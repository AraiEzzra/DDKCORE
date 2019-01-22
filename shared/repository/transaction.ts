import { Transaction } from 'shared/model/transaction';

export interface ITransactionRepository <T extends object> {

    one(): Promise<Transaction<T>>;
    many(): Promise<Transaction<T>>;

}
