import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetRegister, TransactionType, Transaction } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION REGISTER', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.REGISTER,
                    'senderPublicKey': '7f4f01aa4bf5244690c365befb8be5a5b6a533c83b115c94da61120ed879d5b2',
                    'senderAddress': '1359126885585611505',
                    'asset': {
                        'referral': '3832834549593264844'
                    }
                },
                'secret': 'region again shield depart fashion token ecology enhance alarm rail choice garlic'
            }
        };

        const SUCCESS = {
            'type': TransactionType.REGISTER,
            'senderPublicKey': '7f4f01aa4bf5244690c365befb8be5a5b6a533c83b115c94da61120ed879d5b2',
            'senderAddress': '1359126885585611505',
            'fee': 0,
            'asset': {
                'referral': '3832834549593264844'
            }
        };

        const response = await socketRequest<any, Transaction<IAssetRegister>>(REQUEST);

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
