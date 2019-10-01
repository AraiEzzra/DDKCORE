import { TransactionId } from 'ddk.registry/dist/model/common/type';

import { Transaction } from 'shared/model/transaction';
import TransactionRepository from 'core/repository/transaction';
import TransactionPGRepository from 'core/repository/transaction/pg';
import { ConfirmedTransactionRepository } from 'core/repository/transaction/confirmed';

class TransactionStorageService {
    add(transaction: Transaction<any>) {
        TransactionRepository.add(transaction);
        ConfirmedTransactionRepository.add(transaction.id);

        // TODO: add transaction to db?
    }

    delete(id: TransactionId) {
        TransactionRepository.delete(id);
        ConfirmedTransactionRepository.delete(id);

        // TODO: delete transaction from db?
    }

    has(id: TransactionId): boolean {
        return ConfirmedTransactionRepository.has(id);
    }

    get size(): number {
        return ConfirmedTransactionRepository.size;
    }

    async getById(id: TransactionId): Promise<Transaction<any>> {
        if (!ConfirmedTransactionRepository.has(id)) {
            return null;
        }

        const transaction = TransactionRepository.getById(id);
        if (transaction) {
            return transaction;
        }

        return TransactionPGRepository.getById(id);
    }
}

export default new TransactionStorageService();
