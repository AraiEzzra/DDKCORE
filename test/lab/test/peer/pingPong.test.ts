import { expect } from 'chai';
import { DEFAULT_TEST_TIMEOUT, NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { asyncTimeout } from 'shared/util/timer';
import { CUSTOM_CONFIG, PEER, } from 'test/lab/runner/preparer/config';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import PeerController from 'core/controller/peer';
import PeerService from 'core/service/peer';
import { TEST_RUNNER_NAME, TEST_ASYNC_TIMEOUT } from 'test/lab/utils/constants';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import { ActionTypes } from 'core/util/actionTypes';
import { getRandom } from 'core/util/common';

const TEST_NAME = 'TEST_PEER_PING';
const TEST_DONE_STAGE = 'TEST_PEER_PING_DONE';
const TEST_AFTER_STAGE_NAME = 'TEST_PEER_PING_AFTER';

describe('PEER PING PONG', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: []}),
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: []}),
        preparePeerNode({customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.ONE, PEER.TWO]})
    );

    before(async () => {
        await testRunner.preparer.prepare();
    });

    it('Peer ping pong', async () => {
        PeerController.init();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);

        if (NODE_NAME === TEST_RUNNER_NAME) {
            let flag = true;
            const peer = getRandom(PeerNetworkRepository.getAll());
            for (let i = 0; i < 16; i++) {
                const start = new Date().getTime();
                const response = await peer.requestRPC(ActionTypes.PING, {});
                if (response.success) {
                    const finish = new Date().getTime();
                    console.log(`${peer.peerAddress.ip}: ping....${finish - start} ms`);
                    continue;
                }
                flag = false;
                console.log(response.errors);
            }
            expect(flag).to.equal(true);
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
