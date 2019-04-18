import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetDelegate, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION DELEGATE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 103663612,
                'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'senderAddress': '4995063339468361088',
                'type': TransactionType.DELEGATE,
                'salt': '6d0f7be89948d85541c30362751c62f9',
                'asset': {
                    'username': 'foo'
                },
                'fee': 1000000000,
                'signature': '84120b6e279892d4be13f56f98b1fe8f0cf53bb51d4796a32dcb89dc305dcd092aab3a7bda0917186072' +
                    '53135ad02177968184ec130c10ede087e91da55f0d00',
                'id': 'c4c3df64be6b6085201bdda1fa3dc7120293aed43c02f8b030b2821a3452f58b'
            }
        };

        const SUCCESS = {
            'createdAt': 103663612,
            'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            'senderAddress': '4995063339468361088',
            'type': TransactionType.DELEGATE,
            'salt': '6d0f7be89948d85541c30362751c62f9',
            'asset': {
                'username': 'foo'
            },
            'fee': 1000000000,
            'signature': '84120b6e279892d4be13f56f98b1fe8f0cf53bb51d4796a32dcb89dc305dcd092aab3a7bda091718607253135a' +
                'd02177968184ec130c10ede087e91da55f0d00',
            'id': 'c4c3df64be6b6085201bdda1fa3dc7120293aed43c02f8b030b2821a3452f58b'
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetDelegate>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.DELEGATE
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});

