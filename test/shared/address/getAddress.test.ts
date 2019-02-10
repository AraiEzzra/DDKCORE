import { expect } from 'chai';
import { mockData } from './mock/data';
import { getAddressByPublicKey } from 'core/util/publicKey';

describe('Get Address by public key. ', () => {
    it('Should be right addresses by public key', (done) => {
        mockData.forEach(date => {
            const address = getAddressByPublicKey(date.pk);
            expect(address).to.be.a('string');
            expect(address).to.be.equal(date.address);
        });
        done();
    });
});
