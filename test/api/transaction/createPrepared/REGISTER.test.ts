import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetRegister, TransactionType, Transaction } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION REGISTER', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 0,
                'senderPublicKey': '7f4f01aa4bf5244690c365befb8be5a5b6a533c83b115c94da61120ed879d5b2',
                'senderAddress': '1359126885585611505',
                'type': TransactionType.REGISTER,
                'salt': 'd4ae3b9d0f0d590ec12fc1517333d7b7',
                'asset': {
                    'referral': '3832834549593264844'
                },
                'fee': 0,
                'signature': '029cd1ae38aae53c32bc3aad9055ee3bcdb5e14addef5e5d558fe8334d5eb8d1f6e8c22a67cbaa6de7dc31' +
                    'd1c67f703ec1d9d09ad7112040e4774b20a574ef0b',
                'id': '375a70978ccdde2cb2efe68ec6007e7bb956ae1ebac7041e72667f55f4a9200b'
            }
        };

        const SUCCESS = {
            'id': '375a70978ccdde2cb2efe68ec6007e7bb956ae1ebac7041e72667f55f4a9200b',
            'type': TransactionType.REGISTER,
            'createdAt': 0,
            'senderPublicKey': '7f4f01aa4bf5244690c365befb8be5a5b6a533c83b115c94da61120ed879d5b2',
            'senderAddress': '1359126885585611505',
            'signature': '029cd1ae38aae53c32bc3aad9055ee3bcdb5e14addef5e5d558fe8334d5eb8d1f6e8c22a67cbaa6de7dc31d1c6' +
                '7f703ec1d9d09ad7112040e4774b20a574ef0b',
            'fee': 0,
            'salt': 'd4ae3b9d0f0d590ec12fc1517333d7b7',
            'asset': {
                'referral': '3832834549593264844'
            }
        };

        const response = await socketRequest<any, Transaction<IAssetRegister>>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetRegister>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.REGISTER
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});
