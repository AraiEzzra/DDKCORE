import {
    IAsset,
    SerializedTransaction,
    Transaction,
    TransactionModel,
    TransactionType
} from 'shared/model/transaction';
import TransactionDelegateRepo from 'shared/repository/transaction/asset/delegate';
import TransactionRegisterRepo from 'shared/repository/transaction/asset/register';
import TransactionSendRepo from 'shared/repository/transaction/asset/send';
import TransactionStakeRepo from 'shared/repository/transaction/asset/stake';
import TransactionVoteRepo from 'shared/repository/transaction/asset/vote';
import { getAddressByPublicKey } from 'shared/util/account';


const ASSET_REPOSITORIES: { [key: string]: IAssetRepository<IAsset> } = {
    [TransactionType.DELEGATE]: TransactionDelegateRepo,
    [TransactionType.REGISTER]: TransactionRegisterRepo,
    [TransactionType.SEND]: TransactionSendRepo,
    [TransactionType.STAKE]: TransactionStakeRepo,
    [TransactionType.VOTE]: TransactionVoteRepo,
    [TransactionType.SIGNATURE]: null
};

export type TransactionsByBlockResponse = { [blockId: string]:  Array<Transaction<IAsset>> };
export type DeletedTransactionId = string;
export type TransactionId = string;
export type BlockId = string;
export type RawTransaction = {[key: string]: any};
export type RawAsset = {[key: string]: any};

export interface ITransactionRepository <T extends IAsset> {

    add(trs: Transaction<T>): Transaction<T>;
    delete(trs: Transaction<T>): DeletedTransactionId;
    getAll(): Array<Transaction<T>>;
    getByBlockIds(blockIds: Array<BlockId>): TransactionsByBlockResponse;
    getById(trsId: TransactionId): Transaction<T>;
    isExist(trsId: TransactionId): boolean;

}

export interface ITransactionPGRepository <T extends IAsset> {

    deleteById(trsId: TransactionId | Array<TransactionId>): Promise<Array<string>>;
    getByBlockIds(blockIds: Array<BlockId>): Promise<TransactionsByBlockResponse>;
    getById(trsId: TransactionId): Promise<Transaction<T>>;
    getMany(limit: number, offset: number): Promise<Array<Transaction<T>>>;
    isExist(trsId: TransactionId): Promise<boolean>;
    saveOrUpdate(trs: Transaction<T> | Array<Transaction<T>>): Promise<void>;

}

export interface IAssetRepository <T extends IAsset> {

    serialize(asset: T): RawAsset;
    deserialize(rawAsset: RawAsset): T;

}

class SharedTransactionRepo {

    serialize(trs: Transaction<IAsset>): SerializedTransaction<IAsset> {
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
            senderAddress: (trs.senderAddress || getAddressByPublicKey(trs.senderPublicKey)).toString(),
            signature: trs.signature,
            secondSignature: trs.secondSignature,
            fee: trs.fee,
            salt: trs.salt,
            relay: trs.relay,
            asset: asset,
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
            fee: Number(rawTrs.fee),
            salt: rawTrs.salt,
            relay: rawTrs.relay,
            asset: asset,
        });
    }
}

export default new SharedTransactionRepo();
