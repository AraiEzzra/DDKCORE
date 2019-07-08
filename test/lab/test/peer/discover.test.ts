import { expect } from 'chai';
import { DEFAULT_TEST_TIMEOUT, NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { asyncTimeout } from 'shared/util/timer';
import SystemRepository from 'core/repository/system';
import { CUSTOM_CONFIG, PEER, } from 'test/lab/runner/preparer/config';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerController from 'core/controller/peer';
import PeerService from 'core/service/peer';
import { TEST_RUNNER_NAME, TEST_ASYNC_TIMEOUT } from 'test/lab/utils/constants';

const TEST_NAME = 'TEST_PEER_DISCOVER';
const TEST_DONE_STAGE = 'TEST_PEER_DISCOVERING_DONE';
const TEST_AFTER_STAGE_NAME = 'TEST_PEER_DISCOVER_AFTER';

describe('PEER DISCOVER', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.TWO]}),
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: []}),
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.ONE]})
    );

    before(async () => {
        await testRunner.preparer.prepare();
    });

    it('Peer discover', async () => {
        PeerController.init();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);

        if (NODE_NAME === TEST_RUNNER_NAME) {

            await PeerController.discoverNewPeers();
            await asyncTimeout(TEST_ASYNC_TIMEOUT);

            expect(PeerMemoryRepository.getAll().length).to.equal(2);
            expect(SystemRepository.getHeaders().peerCount).to.equal(2);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE);
    });

    after(async () => {

        PeerService.removeAll();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);
        await testRunner.synchronizer.syncAll(TEST_AFTER_STAGE_NAME);
        console.log('AFTER TEST CLEANUP COMPLETED!');
    });
});
