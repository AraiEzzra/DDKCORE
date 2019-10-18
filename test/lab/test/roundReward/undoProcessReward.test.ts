import { expect } from 'chai';

import { DEFAULT_TEST_TIMEOUT, NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import { CUSTOM_CONFIG, PEER } from 'test/lab/runner/preparer/config';
import PeerController from 'core/controller/peer';
import { TEST_RUNNER_NAME } from 'test/lab/utils/constants';
import PeerService from 'core/service/peer';
import BlockController from 'core/controller/block';
import BlockRepository from 'core/repository/block';
import DelegateRepository from 'core/repository/delegate';
import SyncService from 'core/service/sync';

import { blocks } from './mock';

const TEST_NAME = 'TEST_ROUND_PROCESS_REWARD';
const TEST_DONE_STAGE_1 = 'TEST_CHECK_LAST_BLOCK';
const TEST_DONE_STAGE_2 = 'TEST_PROCESS_REWARD';
const TEST_DONE_STAGE_3 = 'TEST_PROCESS_REWARD_UNDO';
const TEST_AFTER_STAGE_NAME = 'TEST_ROUND_PROCESS_REWARD_AFTER';

describe('[Service][Round] process reward', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.TWO, PEER.TEST] }),
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.ONE, PEER.TEST] }),
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.ONE, PEER.TWO] })
    );

    before(async () => {
        await testRunner.preparer.prepare();

        if (NODE_NAME === TEST_RUNNER_NAME) {
            let res = await BlockController.onReceiveBlock({ data: blocks[0], peerAddress: PEER.ONE });
            if (!res.success) {
                console.log(res.errors);
                process.exit(1);
            }
            res = await BlockController.onReceiveBlock({ data: blocks[1], peerAddress: PEER.ONE });
            if (!res.success) {
                console.log(res.errors);
                process.exit(1);
            }
        }
    });

    it('Check last block', async () => {
        PeerController.init();

        if (NODE_NAME === TEST_RUNNER_NAME) {
            const lastBlock = BlockRepository.getLastBlock();

            expect(blocks[1].id).to.equal(lastBlock.id);
        }

        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_1);
    });

    it('Process reward', async () => {
        if (NODE_NAME === TEST_RUNNER_NAME) {
            const firstDelegateAmount = DelegateRepository
                .getDelegate('137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a').account.actualBalance;
            const secondDelegateAmount = DelegateRepository
                .getDelegate('80ede51ab3ca44ff66c9d5e0edebf2b0c94c8d09c5963bc8e80c7cdbb37a4914').account.actualBalance;
            const thirdDelegateAmount = DelegateRepository
                .getDelegate('83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05').account.actualBalance;
            const reward = 50000;
            const expectedFirstDelegateAmount = firstDelegateAmount + reward;
            const expectedSecondDelegateAmount = secondDelegateAmount;
            const expectedThirdDelegateAmount = thirdDelegateAmount + reward;

            const res = await BlockController.onReceiveBlock({ data: blocks[2], peerAddress: PEER.ONE });
            if (!res.success) {
                console.log(res.errors);
                process.exit(1);
            }

            expect(expectedFirstDelegateAmount).to.equal(DelegateRepository
                .getDelegate('137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a').account.actualBalance);
            expect(expectedSecondDelegateAmount).to.equal(DelegateRepository
                .getDelegate('80ede51ab3ca44ff66c9d5e0edebf2b0c94c8d09c5963bc8e80c7cdbb37a4914').account.actualBalance);
            expect(expectedThirdDelegateAmount).to.equal(DelegateRepository
                .getDelegate('83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05').account.actualBalance);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_2);
    });

    it('Process reward undo', async () => {
        if (NODE_NAME === TEST_RUNNER_NAME) {
            const firstDelegateAmount = DelegateRepository
                .getDelegate('137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a').account.actualBalance;
            const secondDelegateAmount = DelegateRepository
                .getDelegate('80ede51ab3ca44ff66c9d5e0edebf2b0c94c8d09c5963bc8e80c7cdbb37a4914').account.actualBalance;
            const thirdDelegateAmount = DelegateRepository
                .getDelegate('83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05').account.actualBalance;
            const reward = 50000;
            const expectedFirstDelegateAmount = firstDelegateAmount - reward;
            const expectedSecondDelegateAmount = secondDelegateAmount;
            const expectedThirdDelegateAmount = thirdDelegateAmount - reward;

            const res = await SyncService.rollback();
            if (!res.success) {
                console.log(res.errors);
                process.exit(1);
            }

            expect(expectedFirstDelegateAmount).to.equal(DelegateRepository
                .getDelegate('137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a').account.actualBalance);
            expect(expectedSecondDelegateAmount).to.equal(DelegateRepository
                .getDelegate('80ede51ab3ca44ff66c9d5e0edebf2b0c94c8d09c5963bc8e80c7cdbb37a4914').account.actualBalance);
            expect(expectedThirdDelegateAmount).to.equal(DelegateRepository
                .getDelegate('83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05').account.actualBalance);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_3);
    });

    after(async () => {
        if (NODE_NAME === TEST_RUNNER_NAME) {
            let res = await SyncService.rollback();
            if (!res.success) {
                console.log(res.errors);
                process.exit(1);
            }
            res = await SyncService.rollback();
            if (!res.success) {
                console.log(res.errors);
                process.exit(1);
            }
        }

        PeerService.removeAll();
        this.timeout(DEFAULT_TEST_TIMEOUT);
        await testRunner.synchronizer.syncAll(TEST_AFTER_STAGE_NAME);
        console.log('AFTER TEST CLEANUP COMPLETED!');
    });
});
