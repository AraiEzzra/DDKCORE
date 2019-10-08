import { expect } from 'chai';
import { DEFAULT_TEST_TIMEOUT, NODE_NAME } from 'test/lab/config';
import { TestRunner } from 'test/lab/runner';
import { asyncTimeout } from 'shared/util/timer';
import SystemRepository from 'core/repository/system';
import { CUSTOM_CONFIG, PEER, } from 'test/lab/runner/preparer/config';
import { preparePeerNode } from 'test/lab/runner/preparer/peerPreparator';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import PeerController from 'core/controller/peer';
import PeerService from 'core/service/peer';
import { TEST_ASYNC_TIMEOUT, TEST_RUNNER_NAME } from 'test/lab/utils/constants';
import { ActionTypes } from 'core/util/actionTypes';
import { createBufferObject } from 'shared/util/byteSerializer';
import { SchemaName } from 'shared/util/byteSerializer/config';

const TEST_NAME = 'TEST_PEER_REMOVE';
const TEST_DONE_STAGE_1 = 'TEST_PEER_REMOVE_DONE';
const TEST_DONE_STAGE_2 = 'TEST_REMOVE_DISCONNECTED_PEER_DONE';
const TEST_AFTER_STAGE_NAME = 'TEST_PEER_REMOVE_AFTER';

describe('PEER REMOVE', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);

    const testRunner = new TestRunner(
        TEST_NAME,
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [] }),
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [] }),
        preparePeerNode({ customConfig: CUSTOM_CONFIG, trustedPeers: [PEER.ONE, PEER.TWO] })
    );

    before(async () => {
        await testRunner.preparer.prepare();
    });

    it('Peer remove', async () => {
        PeerController.init();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);

        if (NODE_NAME === TEST_RUNNER_NAME) {

            expect(PeerMemoryRepository.getAll().length).to.equal(2);
            expect(PeerNetworkRepository.getAll().length).to.equal(2);
            expect(SystemRepository.getHeaders().peerCount).to.equal(2);

            PeerController.removePeer(PEER.TWO);
            await asyncTimeout(TEST_ASYNC_TIMEOUT);

            expect(PeerMemoryRepository.has(PEER.ONE)).to.equal(true);
            expect(PeerMemoryRepository.getAll().length).to.equal(1);
            expect(PeerNetworkRepository.getAll().length).to.equal(1);
            expect(SystemRepository.getHeaders().peerCount).to.equal(1);

            PeerController.removePeer(PEER.ONE);
            await asyncTimeout(TEST_ASYNC_TIMEOUT);

            expect(PeerMemoryRepository.getAll().length).to.equal(0);
            expect(PeerNetworkRepository.getAll().length).to.equal(0);
            expect(SystemRepository.getHeaders().peerCount).to.equal(0);
            PeerService.removeAll();
            await asyncTimeout(TEST_ASYNC_TIMEOUT);
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_1);
    });
    it('Remove disconnected peer', async () => {
        PeerController.init();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);

        if (NODE_NAME === TEST_RUNNER_NAME) {
            expect(PeerMemoryRepository.getAll().length).to.equal(2);
            expect(PeerNetworkRepository.getAll().length).to.equal(2);
            expect(SystemRepository.getHeaders().peerCount).to.equal(2);

            PeerService.broadcast(
                ActionTypes.REMOVE_ALL_PEERS,
                createBufferObject({}, SchemaName.Empty),
                [PEER.TWO]
            );
            await asyncTimeout(TEST_ASYNC_TIMEOUT * 5);
            expect(PeerMemoryRepository.has(PEER.ONE)).to.equal(true);
            expect(PeerMemoryRepository.getAll().length).to.equal(1);
            expect(PeerNetworkRepository.getAll().length).to.equal(1);
            expect(SystemRepository.getHeaders().peerCount).to.equal(1);

            PeerService.broadcast(
                ActionTypes.REMOVE_ALL_PEERS,
                createBufferObject({}, SchemaName.Empty),
                [PEER.ONE]
            );
            await asyncTimeout(TEST_ASYNC_TIMEOUT * 5);
            expect(PeerMemoryRepository.getAll().length).to.equal(0);
            expect(PeerNetworkRepository.getAll().length).to.equal(0);
            expect(SystemRepository.getHeaders().peerCount).to.equal(0);
            PeerService.removeAll();
        }
        await testRunner.synchronizer.syncAll(TEST_DONE_STAGE_2);
    });

    after(async () => {

        PeerService.removeAll();
        await asyncTimeout(TEST_ASYNC_TIMEOUT);
        await testRunner.synchronizer.syncAll(TEST_AFTER_STAGE_NAME);
        console.log('AFTER TEST CLEANUP COMPLETED!');
    });
});
