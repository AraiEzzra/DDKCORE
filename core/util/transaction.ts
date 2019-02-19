import { Transaction } from 'shared/model/transaction';

export const transactionSortFunc = (a: Transaction<any>, b: Transaction<any>): number => {
    if (a.type < b.type) {
        return -1;
    }
    if (a.type > b.type) {
        return 1;
    }
    if (a.createdAt < b.createdAt) {
        return -1;
    }
    if (a.createdAt > b.createdAt) {
        return 1;
    }
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }
    return 0;
};
