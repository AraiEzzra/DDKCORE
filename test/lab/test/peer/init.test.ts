import { expect } from 'chai';
import { NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { asyncTimeout } from 'shared/util/timer';
import SystemRepository from 'core/repository/system';
import { CUSTOM_CONFIG, PEER, } from 'test/lab/runner/preparer/config';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerController from 'core/controller/peer';
import PeerService from 'core/service/peer';
import { TEST_RUNNER_NAME, TEST_ASYNC_TIMEOUT } from 'test/lab/utils/constants';

const TEST_NAME = 'TEST_PEER_CONNECT';
const TEST_DONE_STAGE = 'TEST_PEER_CONNECTION_INIT_DONE';
const TEST_AFTER_STAGE_NAME = 'TEST_PEER_CONNECTION_AFTER';

describe('PEER CONNECT', function () {

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.TWO]}),
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.TEST]}),
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: []})
    );

    before(async () => {
        await testRunner.preparer.prepare();
    });
    it('Peer_init', async () => {

        await PeerController.init();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);

        if (NODE_NAME === TEST_RUNNER_NAME) {
            expect(PeerMemoryRepository.has(PEER.TWO)).to.equal(true);
            expect(PeerMemoryRepository.getAll().length).to.equal(1);
            expect(SystemRepository.getHeaders().peerCount).to.equal(1);

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
