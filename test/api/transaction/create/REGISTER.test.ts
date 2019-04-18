import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetRegister, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION REGISTER', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.REGISTER,
                    'senderPublicKey': '3ddc5f3fd3e526c8b53fe2256d909eda2f93f6a5b918a2c8ead9284d3f2fcb99',
                    'senderAddress': '12379386896170364096',
                    'asset': { 'referral': '4995063339468361088' }
                }, 'secret': 'merge corn predict dumb hat robust lion hammer night enhance cattle lobster'
            }
        };

        const SUCCESS = {
            'type': TransactionType.REGISTER,
            'senderPublicKey': '3ddc5f3fd3e526c8b53fe2256d909eda2f93f6a5b918a2c8ead9284d3f2fcb99',
            'senderAddress': '12379386896170364096',
            'fee': 0,
            'asset': { 'referral': '4995063339468361088' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getTransactionData<IAssetRegister>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {}
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_TRANSACTION\'... Reference could not be resolved:' +
        ' CREATE_TRANSACTION'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});

