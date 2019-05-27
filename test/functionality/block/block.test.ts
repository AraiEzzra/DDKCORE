import BlockRepo from 'core/repository/block';
import RoundRepository from 'core/repository/round';
import BlockController from 'core/controller/block';
import TransactionController from 'core/controller/transaction';
import TransactionPoolService from 'core/service/transactionPool';

// import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { applyBlock, BLOCK_HEIGHT_3, clean, NEW_BLOCK_HEIGHT_3, TEST_BLOCK } from 'test/functionality/utils/index';
import SyncService from 'core/service/sync';
import System from 'core/repository/system';
import { SECRET, TRANSACTION } from 'test/functionality/utils/transaction';

const chai = require('chai'),
    expect = chai.expect; // preference and tested with expect
chai.use(require('chai-sorted'));

chai.use(spies);

describe('ON RECEIVE BLOCK TEST', () => {

    // afterEach(clean);
    context('With consensus', () => {
        it('New block with higher height & without transactions', async () => {

            const response = await applyBlock();
            // const blockHeight3Response = await BlockController.onReceiveBlock({ data: { block: BLOCK_HEIGHT_3 } });
            //
            // const lastBlock = await BlockRepo.getLastBlock();
            //
            // console.log('RESPONSE: ', JSON.stringify(response));
            // console.log('RESPONSE WITH HEIGHT 3: ', JSON.stringify(blockHeight3Response));

            const rounds = RoundRepository.getRounds();
            console.log('ROUNDS COUNT: ', rounds.length);

            // expect(response.success).to.equal(true);
            // expect(lastBlock).to.deep.equal(BLOCK_HEIGHT_3);
        });
        // it('New block with less height', async () => {
        //
        //     const ACTUAL_BLOCK = {
        //         id: 'bf230d87d2c346a598b6547e7dcbea3d52baac4dea6b1e8254ed87950c991ca4',
        //         version: 1,
        //         height: 1,
        //         transactionCount: 0,
        //         amount: 0,
        //         fee: 0,
        //         payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        //         generatorPublicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
        //         signature: 'eb76d2ad7cd5f609f230c2eeaac26ead13b8893ad411f99a4aaf2205d4776' +
        //             'c3ea2bac640d84d760002e2c1014d92213679d99784c8905ec58d601e1b481a9205',
        //         relay: 1,
        //         transactions: [],
        //         createdAt: 106350850,
        //         previousBlockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
        //         history: []
        //     };
        //     const EXPECTED_ERRORS = ['Block bf230d87d2c346a598b6547e7dcbea3d52baac4dea6b1e8254ed87950c991ca4 ' +
        //     'has less height: 1, actual height is 2'];
        //
        //     const response = await BlockController.onReceiveBlock({ data: { block: ACTUAL_BLOCK } });
        //
        //     expect(response.success).to.equal(false);
        //     expect(response.errors).to.deep.equal(EXPECTED_ERRORS);
        // });
        // it('New block with equal id', async () => {
        //
        //     const ACTUAL_BLOCK = {
        //         id: 'bf230d87d2c346a598b6547e7dcbea3d52baac4dea6b1e8254ed87950c991ca4',
        //         version: 1,
        //         height: 2,
        //         transactionCount: 0,
        //         amount: 0,
        //         fee: 0,
        //         payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        //         generatorPublicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
        //         signature: 'eb76d2ad7cd5f609f230c2eeaac26ead13b8893ad411f99a4aaf2205d4776' +
        //             'c3ea2bac640d84d760002e2c1014d92213679d99784c8905ec58d601e1b481a9205',
        //         relay: 1,
        //         transactions: [],
        //         createdAt: 106350850,
        //         previousBlockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
        //         history: []
        //     };
        //     const EXPECTED_ERRORS = ['Block already processed: ' +
        //     'bf230d87d2c346a598b6547e7dcbea3d52baac4dea6b1e8254ed87950c991ca4'];
        //
        //     const response = await BlockController.onReceiveBlock({ data: { block: ACTUAL_BLOCK } });
        //
        //     expect(response.success).to.equal(false);
        //     expect(response.errors).to.deep.equal(EXPECTED_ERRORS);
        // });
        // after(clean);
    });

    // context('Without consensus & without synchronization', () => {
    //     before(async () => {
    //         SyncService.setConsensus(false);
    //         System.synchronization = false;
    //     });
    //     it('New block with higher height', async () => {
    //
    //         const ACTUAL_BLOCK = {
    //             id: '620abed1fc5f486baa7b8f88c66016df45c5ebe806d4b7adcb76101cae8fb3f3',
    //             version: 1,
    //             height: 6,
    //             transactionCount: 0,
    //             amount: 0,
    //             fee: 0,
    //             payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    //             generatorPublicKey: '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
    //             signature: 'a4ac1ece61c82c76a7dcf18d414072e77ea80581ea0680144e0dfcb' +
    //                 '0678e35c53ffe1da8ea9595d89a717197e40ec8c42df84494343c76d34ea3912f58cd4d06',
    //             relay: 2,
    //             transactions: [],
    //             createdAt: 106698630,
    //             previousBlockId: '541416300f24a495dbcd28738f2824805b38682a96d26a133b0b36c10ca86ec5',
    //             history: []
    //         };
    //
    //
    //         const EXPECTED_ERRORS = ['Invalid block'];
    //
    //         const response = await BlockController.onReceiveBlock({ data: { block: NEW_BLOCK_HEIGHT_3 } });
    //         const rounds = RoundRepository.getRounds();
    //
    //         console.log('ROUNDS COUNT: ', rounds.length);
    //
    //         expect(response.success).to.equal(false);
    //         expect(response.errors).to.deep.equal(EXPECTED_ERRORS);
    //     });
    // });

    context('Without consensus', () => {
        before(async () => {
            SyncService.setConsensus(false);
            // await applyBlock();
        });
        it('New block with higher createdAt & equal height', async () => {

            const ACTUAL_BLOCK = {
                id: 'f3185e149fec62a2eff723b5f384b08bf5f5ac8681c00f70b93775b892af3001',
                version: 1,
                height: 2,
                transactionCount: 0,
                amount: 0,
                fee: 0,
                payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                generatorPublicKey: 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
                signature: '907e3e78b34600d80efad66559dbc000e4f1af0' +
                    'c75a07b94921aa5ab03d8039bd831873491f71d2866d2d934ff8db78bddc4763a44b386459537a5735a7e4a03',
                relay: 2,
                transactions: [],
                createdAt: 106673880,
                previousBlockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
                history: []
            };
            const EXPECTED_BLOCK = { ...ACTUAL_BLOCK, relay: 3 };

            const response = await BlockController.onReceiveBlock({ data: { block: NEW_BLOCK_HEIGHT_3 } });
            const lastBlock = await BlockRepo.getLastBlock();

            const rounds = RoundRepository.getRounds();

            console.log('ROUNDS COUNT: ', rounds.length);
            console.log('RESPONSE: ', JSON.stringify(response));

            expect(response.success).to.equal(true);
            // expect(lastBlock).to.deep.equal(NEW_BLOCK_HEIGHT_3);
        });
        // after(clean);
    });

    // context('With consensus & with transactions', () => {
    //     before(async () => {
    //         const transactionRequest = { trs: TRANSACTION, secret: SECRET };
    //
    //         const firstTransactionResponse = TransactionController.transactionCreate(transactionRequest);
    //         const secondTransactionResponse = TransactionController.transactionCreate(transactionRequest);
    //
    //         console.log('FIRST: ', JSON.stringify(firstTransactionResponse));
    //         console.log('SECOND: ', JSON.stringify(secondTransactionResponse));
    //
    //         const transactionsNumber = TransactionPoolService.getSize();
    //
    //         console.log('NUMBER: ', transactionsNumber);
    //     });
    //     it('hello world', () => {
    //         console.log('TEST HERE');
    //     });
    // });

});


