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

    verify(trs: Transaction<T>, sender: Account): Promise<{ verified: boolean, error: Array<string> }>;

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

    applyUnconfirmed(trs: Transaction<T>, sender: Account): void;

    undoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    calcUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    dbSave(trs: Transaction<T>): Array<ITableObject>; // Fixme

    afterSave(trs: Transaction<T>): void;

    objectNormalize(trs: Transaction<T>): Transaction<T>; // to controller

    dbRead(fullBlockRow: IModelTransaction<T>): Transaction<T>;
}

export class TransactionService<T extends Object> implements ITransactionService<T> {

    async verify(trs: Transaction<T>, sender: Account): Promise<{ verified: boolean, error: Array<string> }> {

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
