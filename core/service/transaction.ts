import crypto from 'crypto';

import { IAsset, Transaction, TransactionType } from 'shared/model/transaction';
import { IFunctionResponse, ITableObject } from 'core/util/common';
import ResponseEntity from 'shared/model/response';
import TransactionSendService from './transaction/send';
import { ed, IKeyPair } from 'shared/util/ed';
import { Account } from 'shared/model/account';

export interface IAssetService<T extends IAsset> {
    create(data: any): IAsset;

    getBytes(asset: IAsset): Uint8Array;

    verify(trs: Transaction<IAsset>, sender: Account): ResponseEntity<any>;

    calculateFee(trs: Transaction<IAsset>, sender: Account): number;

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

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean): ResponseEntity<void>;

    create(data: Transaction<{}>, keyPair: IKeyPair): ResponseEntity<Transaction<IAsset>>;

    sign(keyPair: IKeyPair, trs: Transaction<T>): string;

    getId(trs: Transaction<T>): ResponseEntity<string>;

    getHash(trs: Transaction<T>): Buffer;

    getBytes(trs: Transaction<T>, skipSignature?: boolean, skipSecondSignature?: boolean): Uint8Array;

    checkConfirmed(trs: Transaction<T>): IFunctionResponse;

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): IFunctionResponse;

    process(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

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

    normalize(trs: Transaction<T>): ResponseEntity<Transaction<T>>; // to controller

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
        // TODO: check in transaction repo

        return undefined;
    }

    checkSenderTransactions(
        senderId: string,
        verifiedTransactions: Set<string>,
        accountsMap: { [p: string]: Account }
    ): Promise<void> {
        return undefined;
    }

    create(trs: Transaction<{}>, keyPair: IKeyPair): ResponseEntity<Transaction<IAsset>> {
        const errors = [];
        if (!TransactionType[trs.type]) {
            errors.push(`Unknown transaction type ${trs.type}`);
        }

        if (!trs.senderAddress) {
            errors.push('Invalid sender address');
        }

        if (errors.length) {
            return new ResponseEntity({ errors });
        }

        switch (trs.type) {
            case TransactionType.SEND:
                trs.asset = TransactionSendService.create(trs);
                break;
            default:
                break;
        }

        trs.signature = this.sign(keyPair, trs);

        return new ResponseEntity({ data: trs });
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

    getBytes(trs: Transaction<{}>, skipSignature?: boolean, skipSecondSignature?: boolean): Uint8Array {
        return null;
    }

    getHash(trs: Transaction<{}>): Buffer {
        return crypto.createHash('sha256').update(this.getBytes(trs, false, false)).digest();
    }

    getId(trs: Transaction<T>): ResponseEntity<string> {
        const id = this.getHash(trs).toString('hex');

        return new ResponseEntity<string>({ data: id });
    }

    getVotesById(): any {
    }

    list(): any {
    }

    normalize(trs: Transaction<T>): ResponseEntity<Transaction<T>> {
        return undefined;
    }

    process(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        const errors = [];
        if (!TransactionType[trs.type]) {
            errors.push(`Unknown transaction type ${trs.type}`);
        }

        if (!sender) {
            errors.push(`Missing sender`);
        }

        trs.senderAddress = sender.address;

        const idResponse = this.getId(trs);
        if (!idResponse.success) {
            Array.prototype.push.apply(errors, idResponse.errors);
            return new ResponseEntity<void>({ errors });
        }

        if (trs.id && trs.id !== idResponse.data) {
            errors.push('Invalid transaction id');
        }

        return new ResponseEntity<void>({ errors });
    }

    sign(keyPair: IKeyPair, trs: Transaction<{}>): string {
        return ed.sign(this.getHash(trs), keyPair).toString('hex');
    }

    undo(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    undoUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean = false): ResponseEntity<void> {
        const processResponse = this.process(trs, sender);
        if (!processResponse.success) {
            return processResponse;
        }

        if (checkExists) {
            const isConfirmed = this.checkConfirmed(trs);
            if (isConfirmed) {
                throw new Error(`Transaction is already confirmed: ${trs.id}`);
            }
        }

        const errors = [];
        if (trs.senderAddress !== sender.address) {
            errors.push('Invalid sender address');
        }

        if (!trs.senderPublicKey) {
            errors.push(`Missing sender public key`);
        }

        if (sender.publicKey && sender.publicKey !== trs.senderPublicKey) {
            errors.push(`Invalid sender public key`);
        }

        if (trs.amount < 0 ||
            String(trs.amount).indexOf('.') >= 0 ||
            trs.amount.toString().indexOf('e') >= 0
        ) {
            errors.push('Invalid transaction amount');
        }

        // TODO: verify signature
        // TODO: verify timestamp

        return new ResponseEntity<void>({ errors });
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
