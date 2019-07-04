import { TransactionModel } from 'shared/model/transaction';
import { transactionSortFunc } from 'core/util/transaction';

export const validateTransactionsSorting = (transactions: Array<TransactionModel<any>>): boolean => {
    for (let index = 1; index < transactions.length; index++) {
        const prevTransaction = transactions[index - 1];
        const curTransaction = transactions[index];

        const sorted = [prevTransaction, curTransaction].sort(transactionSortFunc);
        if (sorted[0] !== prevTransaction) {
            return false;
        }
    }

    return true;
};
