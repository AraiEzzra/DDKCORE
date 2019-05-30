import { expect } from 'chai';
import { prepare, prepareLoader, socketRequest, testFunction } from 'test/lab/sync/index';
import { DEFAULT_TEST_TIMEOUT } from 'test/lab/config';

describe('TEST TEST TEST TEST', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);
    before(async () => {
        await prepare('TEST_NEW_SYNC');
        // await prepare('TEST_SYNC');
    });
    it('Test synchronization', async () => {
        const nodeName = process.env.NODE_NAME;
        if (nodeName === 'TEST_RUNNER') {
            await testFunction('TEST_NEW_SYNC_DONE');
        } else {
            await socketRequest('TEST_NEW_SYNC_DONE', { node: nodeName });
        }
        console.log('CONGRATULATION, YOUR TEST IS PASSED');
    });
    after(() => {
        console.log('AFTER!');
    });
});
