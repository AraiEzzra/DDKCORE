import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetDelegate, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION DELEGATE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.DELEGATE,
                    'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
                    'senderAddress': '17720385936796370956',
                    'asset': {
                        'username': 'foo'
                    }
                },
                'secret': 'region again shield depart fashion token ecology enhance alarm rail choice garlic'
            }
        };

        const SUCCESS = {
            'type': TransactionType.DELEGATE,
            'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
            'senderAddress': '17720385936796370956',
            'fee': 1000000000,
            'asset': {
                'username': 'foo'
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getTransactionData<IAssetDelegate>(response.body.data)).to.deep.equal(SUCCESS);
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
