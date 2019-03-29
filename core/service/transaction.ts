import crypto from 'crypto';
import cryptoBrowserify from 'crypto-browserify';

import {
    IAsset,
    IAssetStake,
    IAssetTransfer,
    Transaction,
    TransactionModel,
    TransactionType
} from 'shared/model/transaction';
import { ResponseEntity } from 'shared/model/response';
import { ed, IKeyPair } from 'shared/util/ed';
import { Account, Address } from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import TransactionRepo from 'core/repository/transaction';
import TransactionPGRepo from 'core/repository/transaction/pg';
import TransactionPool from 'core/service/transactionPool';
import TransactionQueue from 'core/service/transactionQueue';
import { getTransactionServiceByType, TRANSACTION_BUFFER_SIZE, transactionSortFunc } from 'core/util/transaction';
import BUFFER from 'core/util/buffer';
import { SALT_LENGTH } from 'core/util/const';
import { getAddressByPublicKey } from 'shared/util/account';
import SlotService from 'core/service/slot';
import BlockRepository from 'core/repository/block';
import config from 'shared/config';

export interface IAssetService<T extends IAsset> {
    getBytes(trs: Transaction<T>): Buffer;

    create(trs: TransactionModel<T>): T;

    validate(trs: TransactionModel<T>): ResponseEntity<void>;

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    applyUnconfirmed(trs: Transaction<T>, sender: Account): void;

    undoUnconfirmed(trs: Transaction<T>, sender: Account, senderOnly: boolean): void;

    calculateFee(trs: Transaction<IAsset>, sender: Account): number;
}

export interface ITransactionService<T extends IAsset> {

    checkSenderTransactions(
        senderAddress: Address, verifiedTransactions: Set<string>, accountsMap: Map<Address, Account>
    ): void;

    validate(trs: Transaction<T>): ResponseEntity<void>;

    verifyUnconfirmed(trs: Transaction<T>, sender: Account, checkExists: boolean): ResponseEntity<void>;

    create(data: Transaction<T>, keyPair: IKeyPair, secondKeyPair: IKeyPair): ResponseEntity<Transaction<T>>;

    sign(keyPair: IKeyPair, trs: Transaction<T>): string;

    getId(trs: Transaction<T>): string;

    getHash(trs: Transaction<T>): Buffer;

    getBytes(trs: Transaction<T>): Buffer;

    isConfirmed(trs: Transaction<T>): ResponseEntity<void>;

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): ResponseEntity<void>;

    calculateFee(trs: Transaction<T>, sender: Account): number;

    verifySignature(trs: Transaction<T>, publicKey: string): boolean;

    verifySecondSignature(trs: Transaction<T>, publicKey: string): boolean;

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): boolean;

    applyUnconfirmed(trs: Transaction<T>, sender: Account): void;

    undoUnconfirmed(trs: Transaction<T>, sender?: Account, senderOnly?: boolean): void;

    apply(trs: Transaction<T>, sender: Account): Promise<void>;

    undo(trs: Transaction<T>, sender: Account): Promise<void>;

    afterSave(trs: Transaction<T>): void;

    popFromPool(limit: number): Array<Transaction<IAsset>>;

    returnToQueueConflictedTransactionFromPool(transactions): void;
}

class TransactionService<T extends IAsset> implements ITransactionService<T> {
    afterSave(trs: Transaction<T>): ResponseEntity<void> {
        return new ResponseEntity<void>();
    }

    applyUnconfirmed(trs: Transaction<T>, sender: Account): void {
        sender.actualBalance -= trs.fee || 0;
        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        service.applyUnconfirmed(trs, sender);
    }

    undoUnconfirmed(trs: Transaction<T>, sender: Account, senderOnly = false): void {
        sender.actualBalance += trs.fee || 0;
        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.undoUnconfirmed(trs, sender, senderOnly);
    }

    async apply(trs: Transaction<T>, sender: Account): Promise<void> {
        await TransactionPGRepo.saveOrUpdate(trs);
    }

    async undo(trs: Transaction<T>, sender: Account): Promise<void> {
        await TransactionPGRepo.deleteById(trs.id);
    }

    calculateFee(trs: Transaction<T>, sender: Account): number {
        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.calculateFee(trs, sender);
    }

    checkBalance(amount: number, trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        if (trs.blockId === BlockRepository.getGenesisBlock().id) {
            return new ResponseEntity();
        }

        if (sender.actualBalance >= amount) {
            return { success: true };
        }

        const errors = [];
        errors.push(
            `Not enough money on account ${sender.address}: balance ${sender.actualBalance}, amount: ${amount}`
        );
        return new ResponseEntity({ errors });
    }

    isConfirmed(trs: Transaction<T>): ResponseEntity<void> {
        const errors: Array<string> = TransactionRepo.isExist(trs.id) ? [] : ['Transaction is not confirmed'];
        return new ResponseEntity<void>({ errors: errors });
    }

    checkSenderTransactions(
        senderAddress: Address,
        verifiedTransactions: Set<string>,
        accountsMap: Map<Address, Account>
    ): void {
        const senderTransactions = TransactionPool.getBySenderAddress(senderAddress);
        let i = 0;
        for (const senderTrs of senderTransactions) {
            if (!verifiedTransactions.has(senderTrs.id)) {
                let sender: Account;
                if (accountsMap.has(senderAddress)) {
                    sender = accountsMap.get(senderAddress);
                } else {
                    sender = AccountRepo.getByAddress(senderAddress);
                    sender = sender.getCopy();
                    accountsMap.set(sender.address, sender);
                }

                senderTransactions.slice(i, senderTransactions.length).forEach(() => {
                    this.undoUnconfirmed(<Transaction<T>>senderTrs, sender, true);
                });

                const transactions = [
                    senderTrs,
                    ...TransactionPool.getByRecipientAddress(senderAddress)
                ];

                transactions
                    .sort(transactionSortFunc)
                    .filter((trs: Transaction<T>, index: number) => index > transactions.indexOf(senderTrs))
                    .forEach((trs: Transaction<T>) => {
                        if (trs.type === TransactionType.SEND) {
                            // its as bad as possible, I know, can't make this in another way
                            const asset: IAssetTransfer = <IAssetTransfer><Object>trs.asset;
                            sender.actualBalance -= asset.amount;
                        }
                    });

                const verifyStatus = this.verifyUnconfirmed(<Transaction<T>>senderTrs, sender);

                if (verifyStatus.success) {
                    verifiedTransactions.add(senderTrs.id);
                } else {
                    TransactionPool.remove(senderTrs);
                    TransactionQueue.push(senderTrs);
                    // TODO broadcast undoUnconfirmed in future
                    if (senderTrs.type === TransactionType.SEND) {
                        const asset: IAssetTransfer = <IAssetTransfer><Object>senderTrs.asset;
                        this.checkSenderTransactions(
                            asset.recipientAddress,
                            verifiedTransactions,
                            accountsMap,
                        );
                    }
                }
            }
            i++;
        }
    }

    create(data: TransactionModel<T>, keyPair: IKeyPair, secondKeyPair?: IKeyPair): ResponseEntity<Transaction<T>> {
        const errors = [];

        if (!TransactionType[data.type]) {
            errors.push(`Unknown transaction type ${data.type}`);
        }

        data.senderAddress = data.senderAddress
            ? BigInt(data.senderAddress)
            : getAddressByPublicKey(data.senderPublicKey);
        let sender = AccountRepo.getByAddress(data.senderAddress);
        if (!sender) {
            sender = AccountRepo.add({
                address: data.senderAddress,
                publicKey: data.senderPublicKey
            });
        } else {
            sender.publicKey = data.senderPublicKey;
        }

        if (errors.length) {
            return new ResponseEntity({ errors });
        }

        const trs = new Transaction<T>({
            createdAt: data.createdAt || SlotService.getTime(),
            senderPublicKey: sender.publicKey,
            senderAddress: sender.address,
            type: data.type,
            fee: 0,
            salt: cryptoBrowserify.randomBytes(SALT_LENGTH).toString('hex'),
        });

        const service = getTransactionServiceByType(data.type);
        trs.asset = service.create(data);

        trs.signature = this.sign(keyPair, trs);
        if (secondKeyPair) {
            trs.secondSignature = this.sign(secondKeyPair, trs);
        }
        trs.id = this.getId(trs);

        return new ResponseEntity({ data: trs });
    }

    getBytes(trs: Transaction<T>, skipSignature: boolean = false, skipSecondSignature: boolean = false): Buffer {
        const transactionService = getTransactionServiceByType(trs.type);
        const assetBytes = transactionService.getBytes(trs);

        const bytes = Buffer.alloc(TRANSACTION_BUFFER_SIZE);
        let offset = 0;

        bytes.write(trs.salt, offset, BUFFER.LENGTH.HEX);
        offset += BUFFER.LENGTH.HEX;

        offset = BUFFER.writeInt8(bytes, trs.type, offset);
        offset = BUFFER.writeInt32LE(bytes, trs.createdAt, offset);
        offset = BUFFER.writeNotNull(bytes, trs.senderPublicKey, offset, BUFFER.LENGTH.HEX);

        if (!skipSignature && trs.signature) {
            bytes.write(trs.signature, offset, BUFFER.LENGTH.DOUBLE_HEX, 'hex');
        }
        offset += BUFFER.LENGTH.DOUBLE_HEX;

        if (!skipSecondSignature && trs.secondSignature) {
            bytes.write(trs.secondSignature, offset, BUFFER.LENGTH.DOUBLE_HEX, 'hex');
        }

        return Buffer.concat([bytes, assetBytes]);
    }

    // can be called without signature
    getHash(trs: Transaction<T>): Buffer {
        return crypto.createHash('sha256').update(this.getBytes(trs)).digest();
    }

    // called with signature
    getId(trs: Transaction<T>): string {
        return this.getHash(trs).toString('hex');
    }

    sign(keyPair: IKeyPair, trs: Transaction<T>): string {
        return ed.sign(this.getHash(trs), keyPair).toString('hex');
    }

    validate(trs: Transaction<T>): ResponseEntity<void> {
        const errors = [];

        if (!trs) {
            errors.push('Missing transaction');
            return new ResponseEntity<void>({ errors });
        }

        if (!trs.id) {
            errors.push('Missing id');
        }

        if (!trs.type && trs.type !== 0) {
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

        if (!trs.salt) {
            errors.push(`Missing salt`);
        }

        if (!trs.createdAt && trs.createdAt !== 0) {
            errors.push(`Missing creation time`);
        }

        const service = getTransactionServiceByType(trs.type);
        const verifyResponse = service.validate(trs);
        if (!verifyResponse.success) {
            errors.push(...verifyResponse.errors);
        }
        return new ResponseEntity<void>({ errors });
    }

    verifyBytes(bytes: Uint8Array, publicKey: string, signature: string): boolean {
        return ed.verify(bytes, publicKey, signature);
    }

    verifySecondSignature(trs: Transaction<T>, publicKey: string): boolean {
        const bytes = this.getBytes(trs, false, true);
        return this.verifyBytes(bytes, publicKey, trs.signature);
    }

    verifySignature(trs: Transaction<T>, publicKey: string): boolean {
        const bytes = this.getBytes(trs, true, true);

        if (BlockRepository.getLastBlock().height < config.CONSTANTS.PRE_ORDER_LAST_MIGRATED_BLOCK) {
            return this.verifyBytes(bytes, config.CONSTANTS.PRE_ORDER_PUBLIC_KEY, trs.signature);
        } else {
            return this.verifyBytes(bytes, publicKey, trs.signature);
        }
    }

    verifyUnconfirmed(trs: Transaction<T>, sender: Account): ResponseEntity<void> {
        // need for vote trs, staked amount changes fee
        trs.fee = this.calculateFee(trs, sender);

        const isConfirmed = this.isConfirmed(trs);

        if (isConfirmed.success) {
            return new ResponseEntity<void>({ errors: [`Transaction is already confirmed: ${trs.id}`] });
        }

        if (!this.verifySignature(trs, sender.publicKey)) {
            return new ResponseEntity<void>({ errors: ['Transaction signature is invalid'] });
        }

        if (sender.secondPublicKey && !this.verifySecondSignature(trs, sender.secondPublicKey)) {
            return new ResponseEntity<void>({ errors: ['Transaction second signature is invalid'] });
        }

        if (SlotService.getSlotNumber(trs.createdAt) > SlotService.getSlotNumber()) {
            throw new ResponseEntity<void>({ errors: ['Invalid transaction timestamp. CreatedAt is in the future'] });
        }

        const asset: IAssetTransfer | IAssetStake = <IAssetTransfer | IAssetStake><Object>trs.asset;
        const amount = (asset.amount || 0) + trs.fee;
        const senderBalanceResponse = this.checkBalance(amount, trs, sender);
        if (!senderBalanceResponse.success) {
            return senderBalanceResponse;
        }

        const service: IAssetService<IAsset> = getTransactionServiceByType(trs.type);
        return service.verifyUnconfirmed(trs, sender);
    }

    returnToQueueConflictedTransactionFromPool(transactions: Array<Transaction<IAsset>>): void {
        const verifiedTransactions: Set<string> = new Set();
        const accountsMap: Map<Address, Account> = new Map<Address, Account>();
        for (const trs of transactions) {
            this.checkSenderTransactions(trs.senderAddress, verifiedTransactions, accountsMap);
        }
    }

    popFromPool(limit: number): Array<Transaction<IAsset>> {
        return TransactionPool.popSortedUnconfirmedTransactions(limit);
    }
}

export default new TransactionService();
