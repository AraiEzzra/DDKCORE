import { expect } from 'chai';
import { prepare, prepareLoader } from 'test/lab/sync/index';

describe('SYNCHRONIZATION TEST', () => {
    // before(async () => {
    //     await prepare('TEST_SYNC', prepareLoader, prepareLoader);
    // });
    it('Test synchronization', async () => {
        console.log('TEST IS HERE...');
    });
    after(() => {
        console.log('AFTER!');
    });
});
