import { Transaction, IAsset, TransactionType, TransactionModel } from 'shared/model/transaction';
import {
    IAssetRepository,
    ITransactionRepository as ITransactionRepositoryShared, RawTransaction,
    TransactionsByBlockResponse
} from 'shared/repository/transaction';
import TransactionDelegateRepo from 'core/repository/transaction/asset/delegate';
import TransactionRegisterRepo from 'core/repository/transaction/asset/register';
import TransactionSendRepo from 'core/repository/transaction/asset/send';
import TransactionStakeRepo from 'core/repository/transaction/asset/stake';
import TransactionVoteRepo from 'core/repository/transaction/asset/vote';


const ASSET_REPOSITORIES: { [key: string]: IAssetRepository<IAsset> } = {
    [TransactionType.DELEGATE]: TransactionDelegateRepo,
    [TransactionType.REGISTER]: TransactionRegisterRepo,
    [TransactionType.SEND]: TransactionSendRepo,
    [TransactionType.STAKE]: TransactionStakeRepo,
    [TransactionType.VOTE]: TransactionVoteRepo,
    [TransactionType.SENDSTAKE]: null,
    [TransactionType.SIGNATURE]: null
};

export interface ITransactionRepository<T extends IAsset> extends ITransactionRepositoryShared<T> {

}

class TransactionRepo implements ITransactionRepository<IAsset> {
    private readonly memoryTransactionByBlockId: { [blockId: string]: Array<Transaction<IAsset>> } = {};
    private readonly memoryTransactionById: { [transactionId: string]: Transaction<IAsset> } = {};

    add(trs: Transaction<IAsset>): Transaction<IAsset> {
        if (!this.memoryTransactionByBlockId[trs.blockId]) {
            this.memoryTransactionByBlockId[trs.blockId] = [];
        }
        this.memoryTransactionByBlockId[trs.blockId].push(trs);
        this.memoryTransactionById[trs.id] = trs;
        return trs;
    }

    delete(trs: Transaction<IAsset>): string {
        const blockTrs: Array<Transaction<IAsset>> = this.memoryTransactionByBlockId[trs.blockId];
        for (let i = 0; i < blockTrs.length; i++) {
            if (blockTrs[i].id === trs.id) {
                blockTrs.splice(i, 1);
                break;
            }
        }
        delete this.memoryTransactionById[trs.id];
        return trs.id;
    }

    public getAll(): Array<Transaction<IAsset>> {
        return Object.values(this.memoryTransactionById);
    }

    public getByBlockIds(blocksIds: Array<string>): TransactionsByBlockResponse {
        let result: TransactionsByBlockResponse = {};
        blocksIds.forEach((blockId: string) => {
            result[blockId] = this.memoryTransactionByBlockId[blockId];
        });
        return result;
    }

    public getById(transactionId: string): Transaction<IAsset> {
        if (this.memoryTransactionById[transactionId]) {
            return this.memoryTransactionById[transactionId].getCopy();
        }
        return;
    }

    public isExist(transactionId: string): boolean {
        return !!this.memoryTransactionById[transactionId];
    }
    
    serialize(trs: Transaction<IAsset>): TransactionModel<IAsset> {
        const assetRepo: IAssetRepository<IAsset> = ASSET_REPOSITORIES[trs.type];
        let asset = trs.asset;
        if (assetRepo) {
            asset = assetRepo.serialize(trs.asset);
        }
        return {
            id: trs.id,
            blockId: trs.blockId,
            type: trs.type,
            createdAt: trs.createdAt,
            senderPublicKey: trs.senderPublicKey,
            signature: trs.signature,
            secondSignature: trs.secondSignature,
            salt: trs.salt,
            asset: asset
        };
    }

    deserialize(rawTrs: RawTransaction): Transaction<IAsset> {
        const assetRepo: IAssetRepository<IAsset> = ASSET_REPOSITORIES[rawTrs.type];
        let asset = rawTrs.asset;
        if (assetRepo) {
            asset = assetRepo.deserialize(rawTrs.asset);
        }
        return new Transaction<IAsset>({
            id: rawTrs.id,
            blockId: rawTrs.blockId,
            type: Number(rawTrs.type),
            createdAt: Number(rawTrs.createdAt),
            senderPublicKey: rawTrs.senderPublicKey,
            signature: rawTrs.signature,
            secondSignature: rawTrs.secondSignature,
            salt: rawTrs.salt,
            asset: asset,
        });
    }
}

export default new TransactionRepo();
