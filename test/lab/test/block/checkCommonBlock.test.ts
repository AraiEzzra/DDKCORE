import { expect } from 'chai';
import { NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { asyncTimeout } from 'shared/util/timer';
import { PEER, } from 'test/lab/runner/preparer/peerNames';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import PeerController from 'core/controller/peer';
import PeerService from 'core/service/peer';
import { TEST_RUNNER_NAME, TEST_ASYNC_TIMEOUT } from 'test/lab/utils/constants';
import SyncService from 'core/service/sync';
import blocks from 'test/lab/shared/blocks.json';
import BlockRepository from 'core/repository/block/index';

const TEST_NAME = 'TEST_CHECK_COMMON_BLOCK';
const TEST_DONE_STAGE_1 = 'TEST_CHECK_COMMON_BLOCK_DONE';
const TEST_DONE_STAGE_2 = 'TEST_CHECK_COMMON_BLOCK_NEGATIVE_DONE';
const TEST_DONE_STAGE_3 = 'TEST_CHECK_COMMON_BLOCK_FROM_MEMORY_DONE';
const TEST_DONE_STAGE_4 = 'TEST_CHECK_COMMON_BLOCK_FROM_MEMORY_NEGATIVE_DONE';
const TEST_DONE_STAGE_5 = 'TEST_CHECK_COMMON_BLOCK_WITH_HIGH_HEIGHT_NEGATIVE_DONE';
const TEST_AFTER_STAGE_NAME = 'TEST_CHECK_COMMON_BLOCK_AFTER';

const WRONG_BLOCK_1 = { id: 'c9bd8cfa7cfca57acf70ab9327c3eb6', height: 30 };
const WRONG_BLOCK_2 = { id: 'c9bd8cfa7cfca57acf70ab9327c3eb6', height: 160 };
const WRONG_BLOCK_3 = { id: 'c9bd8cfa7cfca57acf70ab9327c3eb6', height: 1060 };

describe('CHECK COMMON BLOCK', function () {

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({ trustedPeers: [PEER.TWO, PEER.TEST], blocks }),
        preparePeerNode({ trustedPeers: [PEER.ONE, PEER.TEST], blocks }),
        preparePeerNode({ trustedPeers: [PEER.ONE, PEER.TWO] })
    );

    before(async () => {
        await testRunner.preparer.prepare();

    });

    it('Check common block', async () => {

        await PeerController.init();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);

        if (NODE_NAME === TEST_RUNNER_NAME) {

            const responseCommonBlocks = await SyncService.checkCommonBlock(blocks[0]);
            console.log(responseCommonBlocks)
            expect(responseCommonBlocks.success).to.equal(true);
            expect(responseCommonBlocks.data).to.have.property('isExist', true);
            expect(responseCommonBlocks.data).to.have.property('peerAddress');
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_1);
    });
    it('Check common block negative', async () => {

        if (NODE_NAME === TEST_RUNNER_NAME) {

            const responseCommonBlocks = await SyncService.checkCommonBlock(WRONG_BLOCK_1);

            expect(responseCommonBlocks.success).to.equal(true);
            expect(responseCommonBlocks.data).to.have.property('isExist', false);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_2);
    });
    it('Check common block from memory', async () => {

        if (NODE_NAME === TEST_RUNNER_NAME) {

            const responseCommonBlocks = await SyncService.checkCommonBlock(blocks[160]);

            expect(responseCommonBlocks.success).to.equal(true);
            expect(responseCommonBlocks.data).to.have.property('isExist', true);
            expect(responseCommonBlocks.data).to.have.property('peerAddress');

        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_3);
    });
    it('Check common block from memory negative', async () => {

        if (NODE_NAME === TEST_RUNNER_NAME) {

            const responseCommonBlocks = await SyncService.checkCommonBlock(WRONG_BLOCK_2);

            expect(responseCommonBlocks.success).to.equal(true);
            expect(responseCommonBlocks.data).to.have.property('isExist', false);

        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_4);
    });
    it('Check common block with high height negative', async () => {

        if (NODE_NAME === TEST_RUNNER_NAME) {

            const responseCommonBlocks = await SyncService.checkCommonBlock(WRONG_BLOCK_3);

            expect(responseCommonBlocks.success).to.equal(false);
            expect(responseCommonBlocks.errors).to.deep.equal(['ERROR_NOT_ENOUGH_PEERS']);

        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_5);
    });

    after(async () => {
        PeerService.removeAll();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);
        await testRunner.synchronizer.syncAll(TEST_AFTER_STAGE_NAME);
        console.log('AFTER TEST CLEANUP COMPLETED!');
    });
});
