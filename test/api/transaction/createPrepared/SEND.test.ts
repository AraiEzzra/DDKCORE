import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetTransfer, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION SEND', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(), code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION, body: {
                'createdAt': 0,
                'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
                'senderAddress': '17720385936796370956',
                'type': TransactionType.SEND,
                'salt': '97458fd644164a2e71f0312fbc15db50',
                'asset': {
                    'recipientAddress': '4995063339468361088',
                    'amount': 10000000000
                },
                'fee': 1000000,
                'signature': '1e61ae799ebbc98f87600d6db8a26031a414297d3a0f5aa7c4c1325b2b8768a0d861e5730ea4acfe5e92fe' +
                    '78740935e8a16dce5397f844e9a7c9c7129e470208',
                'id': '75c75b630e214b75df80988dfe0bc837dd08d58076cae41f8dd901df9f1c59a9'
            }
        };

        const SUCCESS = {
            'id': '75c75b630e214b75df80988dfe0bc837dd08d58076cae41f8dd901df9f1c59a9',
            'type': TransactionType.SEND,
            'createdAt': 0,
            'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
            'senderAddress': '17720385936796370956',
            'signature': '1e61ae799ebbc98f87600d6db8a26031a414297d3a0f5aa7c4c1325b2b8768a0d861e5730ea4acfe5e92fe7874' +
                '0935e8a16dce5397f844e9a7c9c7129e470208',
            'fee': 1000000,
            'salt': '97458fd644164a2e71f0312fbc15db50',
            'asset': {
                'recipientAddress': '4995063339468361088',
                'amount': 10000000000
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetTransfer>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(), code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION, body: {
                'type': TransactionType.SEND
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});



