import { expect } from 'chai';

describe('SYNCHRONIZATION TEST', () => {
    before(() => {
        console.log('BEFORE!');
    });
    it('Test synchronization', async () => {
        console.log('TEST IS HERE...');
    });
    after(() => {
        console.log('AFTER!');
    });
});
