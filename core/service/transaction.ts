import crypto from 'crypto';

import { IAsset, Transaction, TransactionType } from 'shared/model/transaction';
import { IFunctionResponse, ITableObject } from 'core/util/common';
import ResponseEntity from 'shared/model/response';
import TransactionSendService from './transaction/send';
import { ed, IKeyPair } from 'shared/util/ed';
import { Account, Address } from 'shared/model/account';
import config from 'shared/util/config';
import AccountRepo from '../repository/account';
import TransactionRepo from '../repository/transaction';
import TransactionPool from './transactionPool';
import TransactionQueue from './transactionQueue';
import { transactionSortFunc, getTransactionServiceByType, TRANSACTION_BUFFER_SIZE } from 'core/util/transaction';
import BUFFER from 'core/util/buffer';

export interface ITransactionService<T extends IAsset> {
    getBytes(trs: Transaction<T>): Buffer;

    create(data: Transaction<T>): void;

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean): ResponseEntity<void>;

    applyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
    undoUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    calculateUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    calculateFee(trs: Transaction<IAsset>, sender: Account): number;

    apply(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
    undo(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    dbSave(trs: Transaction<T>): Array<ITableObject>;
    dbRead(fullBlockRow: Transaction<T>): Transaction<T>;
}

export interface ITransactionDispatcher<T extends IAsset> {
    // getAddressByPublicKey(): any; // to utils
    // list(): any; // to repo
    // getById(): any; // to repo

    // getVotesById(): any; // ?

    checkSenderTransactions(
        senderAddress: Address, verifiedTransactions: Set<string>, accountsMap: { [address: string]: Account }
    ): Promise<void>;

    verify(trs: Transaction<T>, sender: Account, checkExists: boolean): ResponseEntity<void>;

    create(data: Transaction<{}>, keyPair: IKeyPair): ResponseEntity<Transaction<IAsset>>;

    sign(keyPair: IKeyPair, trs: Transaction<T>): string;

    getId(trs: Transaction<T>): string;

    getHash(trs: Transaction<T>): Buffer;

    getBytes(trs: Transaction<T>): Buffer;

    checkConfirmed(trs: Transaction<T>): IFunctionResponse;

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    process(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    verifyFields(trs: Transaction<T>, sender: Account): void;

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number;

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    verifySignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;

    verifySecondSignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): IFunctionResponse;

    apply(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    undo(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    applyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    undoUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void>;

    calculateUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    dbSave(trs: Transaction<T>): Array<ITableObject>; // Fixme

    afterSave(trs: Transaction<T>): ResponseEntity<void>;

    normalize(trs: Transaction<T>): ResponseEntity<Transaction<T>>; // to controller

    dbRead(fullBlockRow: Transaction<T>): Transaction<T>;

    popFromPool(limit: number): Promise<Array<Transaction<IAsset>>>;

    lockPoolAndQueue(): void;
    unlockPoolAndQueue(): void;

    returnToQueueConflictedTransactionFromPool(transactions): Promise<ResponseEntity<void>>;
}

class TransactionDispatcher<T extends IAsset> implements ITransactionDispatcher<T> {
    afterSave(trs: Transaction<T>): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    apply(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    applyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        const amount = trs.amount + trs.fee;

        AccountRepo.updateBalanceByPublicKey(trs.senderPublicKey, -amount);

        switch (trs.type) {
            case TransactionType.SEND:
                return TransactionSendService.applyUnconfirmed(trs);
            default:
                return new ResponseEntity();
        }
    }

    calculateUndoUnconfirmed(trs: Transaction<{}>, sender: Account): void {
        sender.actualBalance -= trs.amount + trs.fee;

        switch (trs.type) {
            case TransactionType.SEND:
                return TransactionSendService.calculateUndoUnconfirmed(trs, sender);
            default:
                return;
        }
    }

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number {
        switch (trs.type) {
            case TransactionType.SEND:
                return TransactionSendService.calculateFee(trs, sender);
            default:
                return 0;
        }
    }

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        if (trs.blockId === config.genesisBlock.id) {
            return new ResponseEntity();
        }

        // TODO: calculate this with sender.totalStakedAmount
        if (sender.actualBalance >= amount) {
            return { success: true };
        }

        const errors = [];
        // TODO: subtract sender.totalStakedAmount from sender.actualBalance
        errors.push(
            `Not enough money on account ${sender.address}: balance ${sender.actualBalance}, amount: ${amount}`
        );
        return new ResponseEntity({ errors });
    }

    checkConfirmed(trs: Transaction<T>): IFunctionResponse {
        TransactionRepo.getById(trs.id);

        return undefined;
    }

    async checkSenderTransactions(
        senderAddress: Address,
        verifiedTransactions: Set<string>,
        accountsMap: { [p: number]: Account }
    ): Promise<void> {
        const senderTransactions = TransactionPool.getTransactionsBySenderAddress(senderAddress);
        let i = 0;
        for (const senderTrs of senderTransactions) {
            if (!verifiedTransactions.has(senderTrs.id)) {
                let sender: Account;
                if (accountsMap[senderAddress]) {
                    sender = accountsMap[senderAddress];
                } else {
                    sender = AccountRepo.getByAddress(senderAddress);
                    accountsMap[sender.address] = sender;
                }

                senderTransactions.slice(i, senderTransactions.length).forEach(() => {
                    this.calculateUndoUnconfirmed(senderTrs, sender);
                });

                const transactions = [
                    senderTrs,
                    ...TransactionPool.getTransactionsByRecipientId(senderAddress)
                ];

                transactions
                    .sort(transactionSortFunc)
                    .filter((trs: Transaction<T>, index: number) => index > transactions.indexOf(senderTrs))
                    .forEach((trs: Transaction<T>) => {
                        sender.actualBalance -= trs.amount;
                    });

                const verifyStatus = await TransactionQueue.verify(senderTrs, sender);

                if (verifyStatus.verified) {
                    verifiedTransactions.add(senderTrs.id);
                } else {
                    await TransactionPool.remove(senderTrs);
                    TransactionQueue.push(senderTrs);
                    // TODO broadcast undoUnconfirmed in future
                    if (senderTrs.type === TransactionType.SEND) {
                        await this.checkSenderTransactions(
                            senderTrs.recipientAddress,
                            verifiedTransactions,
                            accountsMap,
                        );
                    }
                }
            }
            i++;
        }
    }

    create(trs: Transaction<T>, keyPair: IKeyPair): ResponseEntity<Transaction<IAsset>> {
        const errors = [];
        if (!TransactionType[trs.type]) {
            errors.push(`Unknown transaction type ${trs.type}`);
        }

        if (!trs.senderAddress) {
            errors.push('Invalid sender address');
        }

        const sender = AccountRepo.getByPublicKey(trs.senderPublicKey);
        if (!sender) {
            errors.push(`Cannot get sender from accounts repository`);
        }

        if (errors.length) {
            return new ResponseEntity({ errors });
        }

        const service = getTransactionServiceByType(trs.type);
        service.create(trs);

        trs.signature = this.sign(keyPair, trs);
        trs.id = this.getId(trs);
        trs.fee = service.calculateFee(trs, sender);

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

    getBytes(trs: Transaction<{}>): Buffer {
        const transactionService = getTransactionServiceByType(trs.type);
        const assetBytes = transactionService.getBytes(trs);

        const bytes = Buffer.alloc(TRANSACTION_BUFFER_SIZE);
        let offset = 0;

        bytes.write(trs.salt, offset, BUFFER.LENGTH.HEX);
        offset += BUFFER.LENGTH.HEX;

        offset = BUFFER.writeInt8(bytes, trs.type, offset);
        offset = BUFFER.writeInt32LE(bytes, trs.createdAt, offset);
        offset = BUFFER.writeNotNull(bytes, trs.senderPublicKey, offset, BUFFER.LENGTH.HEX);

        if (trs.recipientAddress) {
            offset = BUFFER.writeUInt64LE(bytes, trs.recipientAddress, offset);
        } else {
            offset += BUFFER.LENGTH.INT64;
        }

        offset = BUFFER.writeUInt64LE(bytes, trs.amount, offset);

        if (trs.signature) {
            bytes.write(trs.signature, offset, BUFFER.LENGTH.DOUBLE_HEX, 'hex');
        }
        offset += BUFFER.LENGTH.DOUBLE_HEX;

        if (trs.secondSignature) {
            bytes.write(trs.secondSignature, offset, BUFFER.LENGTH.DOUBLE_HEX, 'hex');
        }

        return Buffer.concat([bytes, assetBytes]);
    }

    getHash(trs: Transaction<{}>): Buffer {
        return crypto.createHash('sha256').update(this.getBytes(trs)).digest();
    }

    getId(trs: Transaction<T>): string {
        return this.getHash(trs).toString('hex');
    }

    getVotesById(): any {
    }

    list(): any {
    }

    normalize(trs: Transaction<T>): ResponseEntity<Transaction<T>> {
        return undefined;
    }

    // TODO: validate on receive transaction from another nodes
    process(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        const errors = [];
        const id = this.getId(trs);
        if (trs.id && trs.id !== id) {
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

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        trs.fee = this.calculateUnconfirmedFee(trs, sender);

        // TODO: add trs.stakedAmount to amount sum
        const amount = trs.amount + trs.fee;
        const senderBalanceResponse = this.checkBalance(amount, trs, sender);
        if (!senderBalanceResponse.success) {
            return senderBalanceResponse;
        }

        switch (trs.type) {
            case TransactionType.SEND:
                return TransactionSendService.verifyUnconfirmed(trs);
            default:
                return new ResponseEntity();
        }
    }

    async returnToQueueConflictedTransactionFromPool(transactions): Promise<ResponseEntity<void>> {
        const verifiedTransactions: Set<string> = new Set();
        const accountsMap: { [address: string]: Account } = {};
        for (const trs of transactions) {
            await this.checkSenderTransactions(trs.senderId, verifiedTransactions, accountsMap);
        }
        return new ResponseEntity();
    }

    lockPoolAndQueue(): void {
        TransactionQueue.lock();
        TransactionPool.lock();
    }

    unlockPoolAndQueue(): void {
        TransactionPool.unlock();
        TransactionQueue.unlock();
    }

    async popFromPool(limit: number): Promise<Array<Transaction<IAsset>>> {
        return await TransactionPool.popSortedUnconfirmedTransactions(limit);
    }
}

export default new TransactionDispatcher();
