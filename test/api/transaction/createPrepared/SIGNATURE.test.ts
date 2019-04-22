import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetSignature, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION SIGNATURE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 0,
                'senderPublicKey': 'dfa3f8f1360a220ea7b8b68b791d25e7169aaaa2624fbdc4dfbaa6ca7999136f',
                'senderAddress': '1445661318589395015',
                'type': TransactionType.SIGNATURE,
                'salt': '0b19affd71faf8987dbb05c5911bab85',
                'asset': {
                    'publicKey': '27eb63b7630cbcc5e5ec6612f18e6156a4d867969c1dec53ddbe9487ee6991a4'
                },
                'fee': 1000000,
                'signature': '6fc06248ce91d28b2101120ec0788ab8d463d87e4635f2aea382cb2e45af572e6d2c5d8ff82a70705a5cbf' +
                    '0a4dca3c6cddb97910f715f74479a5249cb4549c09',
                'secondSignature': '759e2c23520165fd680b2ffaaf6e4fc6dee537ac2ec9969ac52e9a4f8a20a22c680803da7e8ffb99' +
                    'ea1be7e46e0235d8eeaffc7e790798af8f79902652624c03',
                'id': '162320e5590716ffeec4d3cc30915f3b26fac5f218ca431106c944e92e8cb713'
            }
        };

        const SUCCESS = {
            'id': '162320e5590716ffeec4d3cc30915f3b26fac5f218ca431106c944e92e8cb713',
            'type': TransactionType.SIGNATURE,
            'createdAt': 0,
            'senderPublicKey': 'dfa3f8f1360a220ea7b8b68b791d25e7169aaaa2624fbdc4dfbaa6ca7999136f',
            'senderAddress': '1445661318589395015',
            'signature': '6fc06248ce91d28b2101120ec0788ab8d463d87e4635f2aea382cb2e45af572e6d2c5d8ff82a70705a5cbf0a4dc' +
                'a3c6cddb97910f715f74479a5249cb4549c09',
            'secondSignature': '759e2c23520165fd680b2ffaaf6e4fc6dee537ac2ec9969ac52e9a4f8a20a22c680803da7e8ffb99ea1be' +
                '7e46e0235d8eeaffc7e790798af8f79902652624c03',
            'fee': 1000000,
            'salt': '0b19affd71faf8987dbb05c5911bab85',
            'asset': {
                'publicKey': '27eb63b7630cbcc5e5ec6612f18e6156a4d867969c1dec53ddbe9487ee6991a4'
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetSignature>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.SIGNATURE
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});



