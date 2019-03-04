import crypto from 'crypto';
import cryptoBrowserify from 'crypto-browserify';

import { IAsset, Transaction, TransactionType } from 'shared/model/transaction';
import { IFunctionResponse, ITableObject } from 'core/util/common';
import ResponseEntity from 'shared/model/response';
import { ed, IKeyPair } from 'shared/util/ed';
import { Account, Address } from 'shared/model/account';
import config from 'shared/util/config';
import AccountRepo from 'core/repository/account';
import TransactionRepo from 'core/repository/transaction';
import TransactionPool from 'core/service/transactionPool';
import TransactionQueue from 'core/service/transactionQueue';
import { transactionSortFunc, getTransactionServiceByType, TRANSACTION_BUFFER_SIZE } from 'core/util/transaction';
import BUFFER from 'core/util/buffer';
import { SALT_LENGTH } from 'core/util/const';

export interface IAssetService<T extends IAsset> {
    getBytes(trs: Transaction<T>): Buffer;

    create(trs: Transaction<T>, data?: T): void;

    validate(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
    verifyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    applyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
    undoUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    calculateUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;
    calculateFee(trs: Transaction<IAsset>, sender: Account): number;
}

export interface ITransactionService<T extends IAsset> {

    checkSenderTransactions(
        senderAddress: Address, verifiedTransactions: Set<string>, accountsMap: { [address: string]: Account }
    ): Promise<void>;

    validate(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
    verifyUnconfirmed(trs: Transaction<T>, sender: Account, checkExists: boolean): ResponseEntity<void>;

    create(data: Transaction<T>, keyPair: IKeyPair): ResponseEntity<Transaction<IAsset>>;

    sign(keyPair: IKeyPair, trs: Transaction<T>): string;

    getId(trs: Transaction<T>): string;

    getHash(trs: Transaction<T>): Buffer;

    getBytes(trs: Transaction<T>): Buffer;

    isConfirmed(trs: Transaction<T>): IFunctionResponse;

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number;

    verifySignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;
    verifySecondSignature(trs: Transaction<T>, publicKey: string, signature: string): IFunctionResponse;
    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): IFunctionResponse;

    applyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;
    undoUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void>;

    apply(trs: Transaction<T>, sender: Account): Promise<ResponseEntity<void>>;
    undo(trs: Transaction<T>, sender: Account): Promise<ResponseEntity<void>>;

    calculateUndoUnconfirmed(trs: Transaction<T>, sender: Account): void;

    afterSave(trs: Transaction<T>): ResponseEntity<void>;

    normalize(trs: Transaction<T>): ResponseEntity<Transaction<T>>; // to controller

    dbSave(trs: Transaction<T>): Array<ITableObject>; // Fixme
    dbRead(fullBlockRow: Transaction<T>): Transaction<T>;

    popFromPool(limit: number): Promise<Array<Transaction<IAsset>>>;

    returnToQueueConflictedTransactionFromPool(transactions): Promise<ResponseEntity<void>>;
}

class TransactionService<T extends IAsset> implements ITransactionService<T> {
    afterSave(trs: Transaction<T>): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    async apply(trs: Transaction<T>, sender: Account): Promise<ResponseEntity<void>> {
        return new ResponseEntity<void>();
    }

    applyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        const amount = trs.amount + trs.fee;

        AccountRepo.updateBalanceByPublicKey(trs.senderPublicKey, -amount);

        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.applyUnconfirmed(trs, sender);
    }

    calculateUndoUnconfirmed(trs: Transaction<{}>, sender: Account): void {
        sender.actualBalance -= trs.amount + trs.fee;

        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.calculateUndoUnconfirmed(trs, sender);
    }

    calculateUnconfirmedFee(trs: Transaction<T>, sender: Account): number {
        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.calculateFee(trs, sender);
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

    isConfirmed(trs: Transaction<T>): IFunctionResponse {
        return { success: TransactionRepo.isExist(trs.id) };
    }

    async checkSenderTransactions(
        senderAddress: Address,
        verifiedTransactions: Set<string>,
        accountsMap: { [p: number]: Account }
    ): Promise<void> {
        const senderTransactions = TransactionPool.getBySenderAddress(senderAddress);
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
                    ...TransactionPool.getByRecipientAddress(senderAddress)
                ];

                transactions
                    .sort(transactionSortFunc)
                    .filter((trs: Transaction<T>, index: number) => index > transactions.indexOf(senderTrs))
                    .forEach((trs: Transaction<T>) => {
                        sender.actualBalance -= trs.amount;
                    });

                const verifyStatus = await TransactionQueue.verify(senderTrs, sender);

                if (verifyStatus.success) {
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

    create(data: Transaction<T>, keyPair: IKeyPair): ResponseEntity<Transaction<IAsset>> {
        const errors = [];
        if (!TransactionType[data.type]) {
            errors.push(`Unknown transaction type ${data.type}`);
        }

        if (!data.senderAddress) {
            errors.push('Invalid sender address');
        }

        const sender = AccountRepo.getByPublicKey(data.senderPublicKey);
        if (!sender) {
            errors.push(`Cannot get sender from accounts repository`);
        }

        if (errors.length) {
            return new ResponseEntity({ errors });
        }

        const service: IAssetService<IAsset> = getTransactionServiceByType(data.type);
        service.create(data);

        const trs = new Transaction<T>({
            senderPublicKey: data.senderPublicKey,
            senderAddress: data.senderAddress,
            recipientAddress: data.recipientAddress,
            type: data.type,
            amount: data.amount,
            fee: service.calculateFee(data, sender),
            salt: cryptoBrowserify.randomBytes(SALT_LENGTH).toString('hex'),
        });

        trs.signature = this.sign(keyPair, trs);
        trs.id = this.getId(trs);

        return new ResponseEntity({ data: trs });
    }

    dbRead(fullBlockRow: any): Transaction<T> {
        return undefined;
    }

    dbSave(trs: Transaction<T>): Array<ITableObject> {
        return undefined;
    }

    getById(): any {
    }

    getBytes(trs: Transaction<T>): Buffer {
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

    getHash(trs: Transaction<T>): Buffer {
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
        return new ResponseEntity<Transaction<T>>({ data: trs });
    }

    sign(keyPair: IKeyPair, trs: Transaction<T>): string {
        return ed.sign(this.getHash(trs), keyPair).toString('hex');
    }

    async undo(trs: Transaction<T>, sender: Account): Promise<ResponseEntity<void>> {
        return new ResponseEntity<void>();
    }

    undoUnconfirmed(trs: Transaction<T>, sender?: Account): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    validate(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        const errors = [];

        if (!trs) {
            errors.push('Missing transaction');
            return new ResponseEntity<void>({ errors });
        }

        if (!trs.id) {
            errors.push('Missing id');
        }

        if (!trs.type) {
            errors.push('Missing type');
        }

        if (!trs.senderAddress) {
            errors.push('Missing sender address');
        }

        if (!trs.senderPublicKey) {
            errors.push(`Missing sender public key`);
        }

        if (!trs.signature) {
            errors.push(`Missing signature`);
        }

        if (!trs.fee) {
            errors.push(`Missing fee`);
        }

        if (!trs.salt) {
            errors.push(`Missing salt`);
        }

        if (!trs.createdAt) {
            errors.push(`Missing creation time`);
        }

        if (!trs.amount) {
            errors.push(`Missing amount`);
        }

        if (trs.amount < 0 ||
            String(trs.amount).indexOf('.') >= 0 ||
            trs.amount.toString().indexOf('e') >= 0
        ) {
            errors.push('Invalid amount');
        }

        const service = getTransactionServiceByType(trs.type);
        const verifyResponse = service.validate(trs, sender);
        if (!verifyResponse.success) {
            errors.push(...verifyResponse.errors);
        }

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

    verifyUnconfirmed(trs: Transaction<T>, sender: Account, checkExists: boolean = false): ResponseEntity<void> {
        // need for vote trs, staked amount changes fee
        const fee = this.calculateUnconfirmedFee(trs, sender);
        if (fee !== trs.fee) {
            trs.fee = fee;
            trs.id = this.getId(trs);
        }

        if (checkExists) {
            const isConfirmed = this.isConfirmed(trs);

            if (isConfirmed.success) {
                return new ResponseEntity<void>({ errors: [`Transaction is already confirmed: ${trs.id}`] });
            }
        }

        // TODO: add trs.stakedAmount to amount sum
        const amount = trs.amount + trs.fee;
        const senderBalanceResponse = this.checkBalance(amount, trs, sender);
        if (!senderBalanceResponse.success) {
            return senderBalanceResponse;
        }

        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.verifyUnconfirmed(trs, sender);
    }

    async returnToQueueConflictedTransactionFromPool(transactions): Promise<ResponseEntity<void>> {
        const verifiedTransactions: Set<string> = new Set();
        const accountsMap: { [address: string]: Account } = {};
        for (const trs of transactions) {
            await this.checkSenderTransactions(trs.senderId, verifiedTransactions, accountsMap);
        }
        return new ResponseEntity();
    }

    async popFromPool(limit: number): Promise<Array<Transaction<IAsset>>> {
        return await TransactionPool.popSortedUnconfirmedTransactions(limit);
    }
}

export default new TransactionService();
