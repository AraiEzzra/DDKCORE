import { expect } from 'chai';
import mock from 'test/core/mock/delegate';

describe('Mock delegates from genesisBlock', () => {
    const delegates = mock.getDelegates();

    it('getDelegates() should return array ', () => {
        expect(Array.isArray(delegates)).to.be.equal(true);
    });
});
