import { IModelTransaction, Transaction } from 'shared/model/transaction';
import { IFunctionResponse, ITableObject } from 'core/util/common';

// wait declare by @Fisenko
declare class Account {
}

// wait declare by @Fisenko
declare class KeyPair {

}

export interface ITransactionService<T extends Object> {
    getAddressByPublicKey(): any; // to utils
    list(): any; // to repo
    getById(): any; // to repo

    getVotesById(): any; // ?

    checkSenderTransactions(
        senderId: string, verifiedTransactions: Set<string>, accountsMap: { [address: string]: Account }
    ): Promise<void>;

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean): Promise<{ verified: boolean, error: Array<string> }>;

    create(data: Transaction<{}>): Transaction<T>;

    sign(keyPair: KeyPair, trs: Transaction<T>): string;

    getId(trs: Transaction<T>): string;

    getHash(trs: Transaction<T>): string;

    getBytes(trs: Transaction<T>, skipSignature: boolean, skipSecondSignature: boolean): Uint8Array;

    checkConfirmed(trs: Transaction<T>): IFunctionResponse;

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): IFunctionResponse;

    process(trs: Transaction<T>, sender: Account): void;

    verifyFields(trs: Transaction<T>, sender: Account): void;

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number;

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): IFunctionResponse;

    verifySignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;

    verifySecondSignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): IFunctionResponse;

    apply(trs: Transaction<T>, sender: Account): void;

    undo(trs: Transaction<T>, sender: Account): void;

    applyUnconfirmed(trs: Transaction<T>, sender?: Account): void;

    undoUnconfirmed(trs: Transaction<T>, sender?: Account): void;

    calcUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    dbSave(trs: Transaction<T>): Array<ITableObject>; // Fixme

    afterSave(trs: Transaction<T>): void;

    objectNormalize(trs: Transaction<T>): Transaction<T>; // to controller

    dbRead(fullBlockRow: IModelTransaction<T>): Transaction<T>;
}

export class TransactionService<T extends Object> implements ITransactionService<T> {

    getAddressByPublicKey(): any { return null; }

    list(): any { return null; }

    getById(): any { return null; }

    getVotesById(): any { return null; }

    checkSenderTransactions(senderId: string, verifiedTransactions: Set<string>, accountsMap: { [p: string]: Account }): Promise<void> { return null; }

    create(data: Transaction<{}>): Transaction<{}> { return undefined; }

    sign(keyPair: KeyPair, trs: Transaction<object>) : string { return undefined; }

    getId(trs: Transaction<object>): string { return undefined; }

    getHash(trs: Transaction<object>): string { return undefined; }

    getBytes(trs: Transaction<object>): Uint8Array { return undefined; }

    checkConfirmed(trs: Transaction<object>): IFunctionResponse { return undefined; }

    checkBalance(amount: number, trs: Transaction<object>): IFunctionResponse { return undefined; }

    process(trs: Transaction<object>): void { return undefined; }

    verifyFields(trs: Transaction<object>): void { return undefined; }

    calculateUnconfirmedFee(trs: Transaction<object>): number { return undefined; }

    verifyUnconfirmed(trs: Transaction<object>): IFunctionResponse { return undefined; }

    verifySignature(trs: Transaction<object>): IFunctionResponse { return undefined; }

    verifySecondSignature(trs: Transaction<object>): IFunctionResponse { return undefined; }

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): IFunctionResponse { return null; }

    apply(trs: Transaction<object>): void { return undefined; }

    undo(trs: Transaction<object>): void { return undefined; }

    applyUnconfirmed(trs: Transaction<object>): void { return undefined; }

    undoUnconfirmed(trs: Transaction<object>): void { return undefined; }

    calcUndoUnconfirmed(trs: Transaction<object>): void { return undefined; }

    dbSave(trs: Transaction<object>): ITableObject[] { return undefined; }

    afterSave(trs: Transaction<object>): void { return undefined; }

    objectNormalize(trs: Transaction<object>): Transaction<object> { return undefined; }

    dbRead(fullBlockRow: IModelTransaction<object>): Transaction<object> { return undefined; }

    async verify(trs: Transaction<T>, sender: Account, checkExists: boolean = false): Promise<{ verified: boolean, error: Array<string> }> {

        try {
            await this.scope.transactionLogic.newVerify({ trs, sender });
        } catch (e) {
            this.scope.logger.debug(`[TransactionQueue][verify]: ${e}`);
            this.scope.logger.debug(`[TransactionQueue][verify][stack]: \n ${e.stack}`);
            return {
                verified: false,
                error: [e]
            };
        }

        try {
            await this.scope.transactionLogic.newVerifyUnconfirmed({ trs, sender });
        } catch (e) {
            this.scope.logger.debug(`[TransactionQueue][verifyUnconfirmed]: ${e}`);
            this.scope.logger.debug(`[TransactionQueue][verifyUnconfirmed][stack]: \n ${e.stack}`);
            return {
                verified: false,
                error: [e]
            };
        }

        return {
            verified: true,
            error: []
        };
    }
}
