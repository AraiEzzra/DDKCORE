import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetSignature, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION SIGNATURE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.SIGNATURE,
                    'senderPublicKey': 'dfa3f8f1360a220ea7b8b68b791d25e7169aaaa2624fbdc4dfbaa6ca7999136f',
                    'senderAddress': '1445661318589395015',
                    'asset': {
                        'publicKey': '27eb63b7630cbcc5e5ec6612f18e6156a4d867969c1dec53ddbe9487ee6991a4'
                    }
                },
                'secret': 'jaguar spray sentence celery elite favorite lunar motion theory supreme penalty rib',
                'secondSecret': 'alcohol quality obey win image pigeon similar cash mango receive round ride'
            }
        };

        const SUCCESS = {
            'type': TransactionType.SIGNATURE,
            'senderPublicKey': 'dfa3f8f1360a220ea7b8b68b791d25e7169aaaa2624fbdc4dfbaa6ca7999136f',
            'senderAddress': '1445661318589395015',
            'fee': 1000000,
            'asset': {
                'publicKey': '27eb63b7630cbcc5e5ec6612f18e6156a4d867969c1dec53ddbe9487ee6991a4'
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getTransactionData<IAssetSignature>(response.body.data)).to.deep.equal(SUCCESS);
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

