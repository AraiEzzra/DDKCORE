import { expect } from 'chai';
import { DEFAULT_TEST_TIMEOUT } from 'test/lab/config';
import { prepareLoader } from 'test/lab/utils/sync';
import { TestRunner } from 'test/lab/runner';

const EXAMPLE_TEST_NAME = 'TEST_EXAMPLE';
const EXAMPLE_TEST_DONE_STAGE_NAME = 'TEST_EXAMPLE_DONE';
const EXAMPLE_TEST_AFTER_STAGE_NAME = 'TEST_EXAMPLE_AFTER';

describe('EXAMPLE TEST', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);

    const testRunner = new TestRunner(EXAMPLE_TEST_NAME, prepareLoader, prepareLoader);

    before(async () => {
        await testRunner.preparer.prepare();
        console.log('PREPARE COMPLETED!');
    });
    it('Positive example test', async () => {
        // your sync or async code place here
        await testRunner.synchronizer.syncAll(EXAMPLE_TEST_DONE_STAGE_NAME);
        console.log('CONGRATULATIONS, YOUR TEST IS PASSED');
    });
    after(async () => {
        // your sync or async code place here
        await testRunner.synchronizer.syncAll(EXAMPLE_TEST_AFTER_STAGE_NAME);
        console.log('AFTER TEST CLEANUP COMPLETED!');
    });
});
