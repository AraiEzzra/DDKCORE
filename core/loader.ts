// import db from 'shared/driver/db';
import TransactionDispatcher from 'core/service/transaction';
import { TransactionStatus, TransactionType} from 'shared/model/transaction';
import { Address, PublicKey, Timestamp} from 'shared/model/account';
import { messageON } from 'shared/util/bus';
import {initControllers} from 'core/controller/index';

/**
 * for mock delegates
 */
const crypto = require('crypto');
import { Account } from 'shared/model/account';
import { getAddressByPublicKey } from 'shared/util/account';
import DelegateRepository from 'core/repository/delegate';
import { ed } from 'shared/util/ed';
import AccountRepository from 'core/repository/account';
import RoundService from 'core/service/round';
import BlockService from 'core/service/block';
/**
 * END
 */

import {Delegate} from 'shared/model/delegate';
import { logger } from 'shared/util/logger';
import { SECOND } from 'core/util/const';
import TransactionQueue from 'core/service/transactionQueue';
enum constant  {
    Limit = 1000
}

interface ITransaction <T extends object> {
    id: string;
    blockId: string;
    type: TransactionType;
    senderPublicKey: PublicKey;
    senderAddress: Address;
    recipientAddress: Address;
    signature: string;
    secondSignature: string;
    amount: number;
    createdAt: Timestamp;
    fee: number;
    status?: TransactionStatus;
    asset: T;
}

export class MockDelegates {
    private startData: Array<{ name: string, secret: string }> = [
        {
            name: 'DELEGATE_10.5.0.1',
            secret: 'whale slab bridge virus merry ship bright fiber power outdoor main enforce'
        },
        {
            name: 'DELEGATE_10.6.0.1',
            secret: 'artwork relax sheriff sting fruit return spider reflect cupboard dice goddess slice'
        },
        {
            name: 'DELEGATE_10.7.0.1',
            secret: 'milk exhibit cabbage detail village hero script glory tongue post clinic wish'
        }
    ];

    public init() {
        for (let i = 0; i < this.startData.length; i++) {
            const account = this.createAccount(this.startData[i]);

            AccountRepository.add(account);
            const delegate: Delegate = DelegateRepository.add(account);
            AccountRepository.attachDelegate(account, delegate);
        }

        // For testing
        // if (process.env.FORGE_SECRET === this.startData[0].secret) {
        //     const hash = crypto.createHash('sha256').update(process.env.FORGE_SECRET, 'utf8').digest();
        //     const keypair = ed.makeKeypair(hash);

        //     setTimeout(() => {
        //         for (let index = 0; index < 250; index++) {
        //             const trsResponse = TransactionDispatcher.create({
        //                 senderAddress: 7897332094363171058,
        //                 senderPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
        //                 recipientAddress: 3002421063889966908,
        //                 type: TransactionType.SEND,
        //                 amount: 100000000,
        //             }, keypair);

        //             TransactionQueue.push(trsResponse.data);
        //         }
        //     }, 5000);
        // }

        BlockService.saveGenesisBlock().then(res => {
            // generateRound calls after 10 seconds
            setTimeout(() => RoundService.generateRound(), 10 * SECOND);
        });
    }

    private createAccount(data): Account {
        const hash = crypto.createHash('sha256').update(data.secret, 'utf8').digest();
        const publicKey: string = ed.makePublicKeyHex(hash);
        const address: number = getAddressByPublicKey(publicKey);

        return new Account({
            address: address,
            publicKey: publicKey,
            secondPublicKey: '',
            actualBalance: 1500000000000000,
            votes: [],
            referrals: [],
            stakes: []
        });
    }
}

class Loader {

    constructor() {
        const delegate = new MockDelegates();
        delegate.init();

        const initTime = new Date().getTime();
        setInterval(() => {
            const currentTime = new Date().getTime();
            const timeInSeconds = Math.floor((currentTime - initTime) / SECOND);
            const projectedHeight = Math.floor(timeInSeconds / 10) + 1;
            logger.debug(`[Loader] time in seconds: ${timeInSeconds}, projected height: ${projectedHeight}`);
        }, SECOND);
    }

    public async start() {
        // const totalAmountTrs = await db.one(`
        //     SELECT count(*)::int AS count
        //     FROM trs;
        // `);

        // const countIteration = Math.ceil(totalAmountTrs.count / constant.Limit);

        // for (let i = 0; i < countIteration; i ++ ) {
        //     const transactionBatch = await this.getTransactionBatch(constant.Limit * i);
        //     for (const trs of transactionBatch) {
        //         await TransactionService.applyUnconfirmed(trs);
        //     }
        // }
        initControllers();
        // messageON('WARN_UP_FINISHED');
    }

    private async getTransactionBatch(offset: number): Promise<Array<ITransaction<any>>> {
        // const transactions: Array<ITransaction<any>> = await db.many(`
        //     SELECT *
        //     FROM trs
        //     ORDER BY created_at ASC
        //     LIMIT ${constant.Limit}
        //     OFFSET ${offset}
        // `);
        // return transactions;
        return [];
    }
}

export default new Loader();
