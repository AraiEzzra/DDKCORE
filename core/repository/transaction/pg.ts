import db, { pgpE } from 'shared/driver/db/index';
import { Transaction, IAsset } from 'shared/model/transaction';
import {
    ITransactionPGRepository as ITransactionPGRepositoryShared, RawTransaction,
    TransactionsByBlockResponse
} from 'shared/repository/transaction';
import queries from 'core/repository/queries/transaction';

export interface ITransactionPGRepository<T extends IAsset> extends ITransactionPGRepositoryShared<T> {

}

class TransactionPGRepo implements ITransactionPGRepository<IAsset> {
    private readonly tableName: string = 'trs';
    private readonly tableFields: Array<string> = [
        'id',
        'block_id',
        'type',
        'created_at',
        'sender_public_key',
        'sender_address',
        'recipient_address',
        'amount',
        'fee',
        'signature',
        'second_signature',
        'salt',
        'asset'
    ];
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, {table: this.tableName});

    serialize(trs: Transaction<IAsset>): object {
        return {
            id: trs.id,
            block_id: trs.blockId,
            type: trs.type,
            created_at: trs.createdAt,
            sender_public_key: trs.senderPublicKey,
            sender_address: trs.senderAddress,
            recipient_address: trs.recipientAddress,
            amount: trs.amount,
            fee: trs.fee,
            signature: trs.signature,
            second_signature: trs.secondSignature,
            salt: trs.salt,
            asset: trs.asset
        };
    }
    
    deserialize(rawTrs: RawTransaction, radix: number = 10): Transaction<IAsset> {
        return new Transaction<IAsset>({
            id: rawTrs.id,
            blockId: rawTrs.block_id,
            type: parseInt(rawTrs.type, radix),
            createdAt: parseInt(rawTrs.created_at, radix),
            senderPublicKey: rawTrs.sender_public_key,
            senderAddress: parseInt(rawTrs.sender_address, radix),
            recipientAddress: parseInt(rawTrs.recipient_address, radix),
            amount: parseInt(rawTrs.amount, radix),
            fee: parseInt(rawTrs.fee, radix),
            signature: rawTrs.signature,
            secondSignature: rawTrs.second_signature,
            salt: rawTrs.salt,
            asset: rawTrs.asset,
        });
    }

    async deleteById(trsId: string | Array<string>): Promise<void> {
        const trsIds: Array<string> = [].concat(trsId);
        await db.none(queries.deleteByIds, [trsId]);
    }

    async getByBlockIds(blockIds: Array<string>): Promise<TransactionsByBlockResponse> {
        let result: TransactionsByBlockResponse = {};
        const rawTransactions: Array<RawTransaction> =
            await db.manyOrNone(queries.getByBlockIds, [blockIds]);
        if (!rawTransactions) {
            return result;
        }
        rawTransactions.forEach((rawTransaction: RawTransaction) =>  {
            const transaction: Transaction<IAsset> = this.deserialize(rawTransaction);
            if (!result[transaction.blockId]) {
                result[transaction.blockId] = [];
            }
            result[transaction.blockId].push(transaction);
        });
        return result;
    }

    async getById(trsId: string): Promise<Transaction<IAsset>> {
        const rawTransaction: RawTransaction = await db.oneOrNone(queries.getById, { id: trsId });
        if (!rawTransaction) {
            return;
        }
        return this.deserialize(rawTransaction);
    }

    async getMany(limit: number, offset: number): Promise<Array<Transaction<IAsset>>> {
        let result: Array<Transaction<IAsset>> = [];
        const rawTransactions:  Array<RawTransaction> =
            await db.manyOrNone(queries.getTransactionBatch, { limit, offset });
        if (!rawTransactions) {
            return result;
        }
        rawTransactions.forEach((rawTransaction: RawTransaction) => {
            result.push(this.deserialize(rawTransaction));
        });
        return result;
    }

    async isExist(trsId: string): Promise<boolean> {
        const transaction: Transaction<IAsset> = await this.getById(trsId);
        return !!transaction;
    }

    async saveOrUpdate(trs: Transaction<IAsset> | Array<Transaction<IAsset>>): Promise<void> {
        const transactions: Array<Transaction<IAsset>> = [].concat(trs);
        const values: Array<object> = [];
        transactions.forEach((transaction) => {
            values.push(this.serialize(transaction));
        });
        const query = pgpE.helpers.insert(values, this.columnSet) +
            ' ON CONFLICT(id) DO UPDATE SET ' +
            this.columnSet.assignColumns({from: 'EXCLUDED', skip: 'id'});
        await db.none(query);
        return null;
    }
}

export default new TransactionPGRepo();
