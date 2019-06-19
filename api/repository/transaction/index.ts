import { IAsset, IAssetVote, Transaction, TransactionType } from 'shared/model/transaction';
import db from 'shared/driver/db';
import query from 'api/repository/transaction/query';
import { Sort } from 'api/utils/common';
import SharedTransactionPGRepo from 'shared/repository/transaction/pg';
import { toSnakeCase } from 'shared/util/util';

type AllowedFilters = {
    blockId?: string;
    senderPublicKey?: string;
    type?: number;
    recipientAddress?: string;
    asset?: string;
};

const UPDATE_TRANSACTIONS_COUNT_INTERVAL = 30000;

class TransactionPGRepository {
    private transactionsCount: number;

    constructor() {
        this.transactionsCount = 0;

        setInterval(this.updateTransactionsCount, UPDATE_TRANSACTIONS_COUNT_INTERVAL);
    }

    private updateTransactionsCount = async (): Promise<void> => {
        const result = await db.oneOrNone(query.getTransactionsCount);
        if (result) {
            this.transactionsCount = Number(result.count);
        }
    }

    async getOne(id: string): Promise<Transaction<IAsset> | null> {
        const transaction = await db.oneOrNone(query.getTransaction, { id });
        return transaction ? SharedTransactionPGRepo.deserialize(transaction) : null;
    }

    async getMany(
        filter: AllowedFilters,
        sort: Array<Sort>,
        limit: number,
        offset: number,
    ): Promise<{ transactions: Array<Transaction<IAsset>>, count: number }> {
        if (filter && filter.recipientAddress) {
            filter.asset = `{"recipientAddress": "${filter.recipientAddress}"}`;
            delete filter.recipientAddress;
        }

        const transactions = await db.manyOrNone(
            query.getTransactions(filter, sort.map(elem => `${toSnakeCase(elem[0])} ${elem[1]}`).join(', ')), {
                ...filter,
                limit,
                offset
            });
        if (transactions && transactions.length) {
            return {
                transactions: transactions.map(trs => SharedTransactionPGRepo.deserialize(trs)),
                count: this.transactionsCount,
            };
        }

        return {
            transactions: [],
            count: 0,
        };

    }

    async getVotesWithStakeReward(senderPublicKey: string, limit: number, offset: number):
        Promise<{ transactions: Array<Transaction<IAssetVote>>, count: number }> {
        const transactions = await db.manyOrNone(query.getVotesWithStakeReward, {
            senderPublicKey,
            voteType: TransactionType.VOTE,
            limit,
            offset
        });

        if (transactions && transactions.length) {
            return {
                transactions: transactions.map(
                    trs => SharedTransactionPGRepo.deserialize(trs) as Transaction<IAssetVote>
                ),
                count: this.transactionsCount,
            };
        }

        return {
            transactions: [],
            count: 0
        };
    }
}

export default new TransactionPGRepository();
