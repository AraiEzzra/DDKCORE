import db, { pgpE } from 'shared/driver/db/index';
import { Transaction, IAsset, TransactionType } from 'shared/model/transaction';
import {
    IAssetRepository,
    ITransactionPGRepository as ITransactionPGRepositoryShared, RawTransaction,
    TransactionsByBlockResponse
} from 'shared/repository/transaction/transaction';
import queries from 'core/repository/queries/transaction';
import TransactionDelegateRepo from 'core/repository/transaction/asset/delegate';
import TransactionRegisterRepo from 'core/repository/transaction/asset/register';
import TransactionSendRepo from 'core/repository/transaction/asset/send';
import TransactionStakeRepo from 'core/repository/transaction/asset/stake';
import TransactionVoteRepo from 'core/repository/transaction/asset/vote';

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
        'signature',
        'second_signature',
        'salt',
        'asset'
    ];
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, {table: this.tableName});
    // todo: help me, how does this work?
    /*
    private readonly assetRepositories: { [key in TransactionType]: IAssetRepository<IAsset> } = {
        [TransactionType.DELEGATE]: TransactionDelegateRepo,
        [TransactionType.REGISTER]: TransactionRegisterRepo,
        [TransactionType.SEND]: TransactionSendRepo,
        [TransactionType.STAKE]: TransactionStakeRepo,
        [TransactionType.VOTE]: TransactionVoteRepo,
        [TransactionType.SENDSTAKE]: null,
        [TransactionType.SIGNATURE]: null
    };
    */
    private readonly assetRepositories: { [key: number]: IAssetRepository<IAsset> } = {
        0: TransactionRegisterRepo,
        10: TransactionSendRepo,
        20: null,
        30: TransactionDelegateRepo,
        40: TransactionStakeRepo,
        50: null,
        60: TransactionVoteRepo
    };

    serialize(trs: Transaction<IAsset>): object {
        const assetRepo: IAssetRepository<IAsset> = this.assetRepositories[trs.type];
        let asset = trs.asset;
        if (assetRepo) {
            asset = assetRepo.serialize(trs.asset);
        }
        return {
            id: trs.id,
            block_id: trs.blockId,
            type: trs.type,
            created_at: trs.createdAt,
            sender_public_key: trs.senderPublicKey,
            signature: trs.signature,
            second_signature: trs.secondSignature,
            salt: trs.salt,
            asset: asset
        };
    }
    
    deserialize(rawTrs: RawTransaction): Transaction<IAsset> {
        const assetRepo: IAssetRepository<IAsset> = this.assetRepositories[rawTrs.type];
        let asset = rawTrs.asset;
        if (assetRepo) {
            asset = assetRepo.deserialize(rawTrs.asset);
        }
        return new Transaction<IAsset>({
            id: rawTrs.id,
            blockId: rawTrs.block_id,
            type: Number(rawTrs.type),
            createdAt: Number(rawTrs.created_at),
            senderPublicKey: rawTrs.sender_public_key,
            signature: rawTrs.signature,
            secondSignature: rawTrs.second_signature,
            salt: rawTrs.salt,
            asset: asset,
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
