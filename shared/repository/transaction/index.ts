import { IAsset, Transaction } from 'shared/model/transaction';

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

    serialize(trs: Transaction<T>): RawTransaction;
    deserialize(rawTrs: RawTransaction): Transaction<T>;

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
