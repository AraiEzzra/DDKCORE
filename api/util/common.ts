import { TransactionType } from 'shared/model/transaction';

export interface IListContainer<T extends object> {
    data: T[];
    total_count: number;
}
