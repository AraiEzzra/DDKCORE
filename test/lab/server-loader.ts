import { expect } from 'chai';
import { DEFAULT_TEST_TIMEOUT, NODE_NAME } from 'test/lab/config';
import { TEST_RUNNER_NAME, TEST_SYNC_NAME } from 'test/lab/utils/constants';
import testSocketServer from 'test/lab/utils/socket/testSocketServer';
import { TestRunner } from 'test/lab/runner';

describe('PREPARING TEST ENVIRONMENT...', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);
    const syncTestRunner = new TestRunner(TEST_SYNC_NAME);
    before(async () => {
        if (NODE_NAME === TEST_RUNNER_NAME) {
            await testSocketServer.run();
        } else {
            await syncTestRunner.synchronizer.syncPeerNode();
        }
    });
    it('Sync test environment', () => {
        console.log('Synchronization successfully completed');
    });
});
