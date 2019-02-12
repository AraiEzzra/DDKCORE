import { expect } from 'chai';
import { mockData } from './mock/data';
import { getAddressByPublicKey } from 'shared/util/account.utils';

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
