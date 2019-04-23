import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetTransfer, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION SEND', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 103758007,
                'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'senderAddress': '4995063339468361088',
                'type': TransactionType.SEND,
                'salt': 'f2c29354024c7dcbda111057cd8553ec',
                'asset': {
                    'recipientAddress': '7897332094363171058',
                    'amount': 1000000000
                },
                'fee': 100000,
                'signature': '15a91453e38c6807e1f060c9e6f8b1cad45a2f1a6af7349d129a3f43d84b3ae7d2e7f0ecd3e5fe6c14c51' +
                    '83642f661b69119201bacd10594a6a4d4b6cada6801',
                'id': '30a10d9c9352d2b554f951689499adc6f2baf7689faea6b776e55b173094f4a5'
            }
        };

        const SUCCESS = {
            'id': '30a10d9c9352d2b554f951689499adc6f2baf7689faea6b776e55b173094f4a5',
            'type': TransactionType.SEND,
            'createdAt': 103758007,
            'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            'senderAddress': '4995063339468361088',
            'signature': '15a91453e38c6807e1f060c9e6f8b1cad45a2f1a6af7349d129a3f43d84b3ae7d2e7f0ecd3e5fe6c14c51836' +
                '42f661b69119201bacd10594a6a4d4b6cada6801',
            'fee': 100000,
            'salt': 'f2c29354024c7dcbda111057cd8553ec',
            'asset': { 'recipientAddress': '7897332094363171058', 'amount': 1000000000 }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetTransfer>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.SEND
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});



