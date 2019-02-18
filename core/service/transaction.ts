import {IAsset, Transaction} from 'shared/model/transaction';
import { IFunctionResponse, ITableObject } from 'core/util/common';
import ResponseEntity from 'shared/model/response';

// wait declare by @Fisenko
declare class Account {
}

// wait declare by @Fisenko
declare class KeyPair {

}

export interface IAssetService<T extends IAsset> {
    create(data: any): Promise<IAsset>;

    getBytes(asset: IAsset): Uint8Array;

    verify(asset: IAsset, sender: Account): Promise<ResponseEntity<IAsset>>;

    calculateFee(asset: IAsset, sender: Account): number;

    calcUndoUnconfirmed(asset: IAsset, sender: Account): void;

    applyUnconfirmed(asset: IAsset): Promise<void>;

    undoUnconfirmed(asset: IAsset): Promise<void>;

    apply(asset: IAsset): Promise<void>;

    undo(asset: IAsset): Promise<void>;

    dbRead(fullTrsObject: any): IAsset;

    dbSave(asset: IAsset): Promise<void>;
}

export interface ITransactionService<T extends IAsset> {
    getAddressByPublicKey(): any; // to utils
    list(): any; // to repo
    getById(): any; // to repo

    getVotesById(): any; // ?

    checkSenderTransactions(
        senderId: string, verifiedTransactions: Set<string>, accountsMap: { [address: string]: Account }
    ): Promise<void>;

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean):
        Promise<{ verified: boolean, errors: Array<string> }>;

    create(data: Transaction<{}>): Transaction<T>;

    sign(keyPair: KeyPair, trs: Transaction<T>): string;

    getId(trs: Transaction<T>): ResponseEntity<string>;

    getHash(trs: Transaction<T>): string;

    getBytes(trs: Transaction<T>, skipSignature?: boolean, skipSecondSignature?: boolean): Uint8Array;

    checkConfirmed(trs: Transaction<T>): IFunctionResponse;

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): IFunctionResponse;

    process(trs: Transaction<T>, sender: Account): void;

    verifyFields(trs: Transaction<T>, sender: Account): void;

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number;

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): IFunctionResponse;

    verifySignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;

    verifySecondSignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): IFunctionResponse;

    apply(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    undo(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    applyUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void>;

    undoUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void>;

    calcUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    dbSave(trs: Transaction<T>): Array<ITableObject>; // Fixme

    afterSave(trs: Transaction<T>): ResponseEntity<void>;

    objectNormalize(trs: Transaction<T>): ResponseEntity<Transaction<T>>; // to controller

    dbRead(fullBlockRow: Transaction<T>): Transaction<T>;
}

class TransactionService<T extends IAsset> implements ITransactionService<T> {
    afterSave(trs: Transaction<T>): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    apply(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    applyUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    calcUndoUnconfirmed(trs: Transaction<T>, sender: Account): void {
    }

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number {
        return 0;
    }

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): IFunctionResponse {
        return undefined;
    }

    checkConfirmed(trs: Transaction<T>): IFunctionResponse {
        return undefined;
    }

    checkSenderTransactions(
        senderId: string,
        verifiedTransactions: Set<string>,
        accountsMap: { [p: string]: Account }
        ): Promise<void> {
        return undefined;
    }

    create(data: Transaction<{}>): Transaction<T> {
        return undefined;
    }

    dbRead(fullBlockRow: any): Transaction<T> {
        return undefined;
    }

    dbSave(trs: Transaction<T>): Array<ITableObject> {
        return undefined;
    }

    getAddressByPublicKey(): any {
    }

    getById(): any {
    }

    getBytes(trs: Transaction<T>, skipSignature?: boolean, skipSecondSignature?: boolean): Uint8Array {
        return undefined;
    }

    getHash(trs: Transaction<T>): string {
        return '';
    }

    getId(trs: Transaction<T>): ResponseEntity<string> {
        return new ResponseEntity<string>();
    }

    getVotesById(): any {
    }

    list(): any {
    }

    objectNormalize(trs: Transaction<T>): ResponseEntity<Transaction<T>> {
        return undefined;
    }

    process(trs: Transaction<T>, sender: Account): void {
    }

    sign(keyPair: KeyPair, trs: Transaction<T>): string {
        return '';
    }

    undo(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    undoUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean):
        Promise<{ verified: boolean; errors: Array<string> }> {
        return undefined;
    }

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): IFunctionResponse {
        return undefined;
    }

    verifyFields(trs: Transaction<T>, sender: Account): void {
    }

    verifySecondSignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse {
        return undefined;
    }

    verifySignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse {
        return undefined;
    }

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): IFunctionResponse {
        return undefined;
    }
}

export default new TransactionService();
