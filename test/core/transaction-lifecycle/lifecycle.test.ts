import TransactionPoolService from 'core/service/transactionPool';
import BlockRepo from 'core/repository/block';
import TransactionQueueService from 'core/service/transactionQueue';
import validTransactions from 'test/core/transaction-lifecycle/validTransactions';
import invalidTransactions from 'test/core/transaction-lifecycle/invalidTransactions';
import { expect } from 'chai';
import BlockService from 'core/service/block';
import db from 'shared/driver/db';
import config from 'shared/config';

const API_URL = 'ws://10.8.0.6:7008';
const accounts = {
    empty: {
        address: BigInt('12384687466662805891'),
        publicKey: '49a2b5e68f851a11058748269a276b0c0d36497215548fb40d4fe4e929d0283a',
        privateKey: 'sad case cement sign ghost bamboo soap depart discover acoustic spot toilet'
    },
    system: {
        address: BigInt('4995063339468361088'),
        publicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
        privateKey: 'hen worry two thank unfair salmon smile oven gospel grab latin reason'
    },
    delegate1: {
        address: BigInt('933553974927686133'),
        publicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
        privateKey: 'milk exhibit cabbage detail village hero script glory tongue post clinic wish'
    },
    delegate2: {
        address: BigInt('3002421063889966908'),
        publicKey: 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
        privateKey: 'artwork relax sheriff sting fruit return spider reflect cupboard dice goddess slice'
    },
    delegate3: {
        address: BigInt('7897332094363171058'),
        publicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
        privateKey: 'whale slab bridge virus merry ship bright fiber power outdoor main enforce'
    }
};

let socket;

const testAction = async (transactions) => {
    let responses = 0;

    return new Promise((resolve) => {
        const trs = [...transactions];
        trs.forEach((transaction) => {
            socket.emit('message', transaction);
        });

        socket.on('message', (res) => {
            // console.log(JSON.stringify(res));
            responses++;
            if (responses === trs.length) {
                setTimeout(() => {
                    resolve();
                }, 1000);
            }
        });
    });
};

describe('Lifetime', function() {

    this.timeout(0);

    before(async () => {
        // await Loader.start();
        socket = require('socket.io-client')(API_URL, {
            transports: ['websocket']
        });
    });

    context('without conflicts', () => {
        before(async () => {
            const transactions = [invalidTransactions.SEND(accounts.system)];
            await testAction(transactions);
        });

        it('should decline transaction due to validation', function () {
            const poolSize = TransactionPoolService.getSize();
            expect(poolSize).to.be.equal(0);
        });
    });

    context('without conflicts', () => {
        before(async () => {
            const transactions = [validTransactions.SEND(accounts.system), validTransactions.SEND(accounts.system)];
            await testAction(transactions);
        });

        it('should move 2 transactions to pool', function () {
            const poolSize = TransactionPoolService.getSize();
            expect(poolSize).to.be.equal(2);
        });
    });

    context('with conflicts', () => {
        before(async () => {
            const transactions = [validTransactions.VOTE(accounts.system, ['+' + accounts.delegate2.publicKey]), validTransactions.SEND(accounts.system)];
            await testAction(transactions);
        });

        it('should move 1 transaction to pool and 1 to queue', function () {
            const poolSize = TransactionPoolService.getSize();
            const queueSize = TransactionQueueService.getSize();
            expect(poolSize).to.be.equal(3);
            expect(queueSize.conflictedQueue + queueSize.queue).to.be.equal(1);
        });
    });

    context('block generation', () => {
        before(async () => {
            await BlockService.generateBlock({
                publicKey: accounts.system.publicKey,
                privateKey: accounts.system.privateKey
            }, Math.floor(Date.now() / 1000));
        });

        it('should crate block with 3 transactions', function () {
            const block = BlockRepo.getLastBlock();
            expect(block.transactionCount).to.be.equal(3);
        });
    });

    after(async () => {
        let res = await db.query(`DELETE FROM block WHERE id != $1`, [config.GENESIS_BLOCK.id]);
        res = await db.query(`DELETE FROM trs WHERE block_id != $1`, [config.GENESIS_BLOCK.id]);
    });
});
