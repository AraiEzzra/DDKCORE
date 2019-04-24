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
                'createdAt': 0,
                'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
                'senderAddress': '17720385936796370956',
                'type': TransactionType.DELEGATE,
                'salt': '768f92986c3c426ccb8d139e99aa9500',
                'asset': {
                    'username': 'foo'
                },
                'fee': 1000000000,
                'signature': 'f87770430f501b9817ae1274bc98c26ea9ddcd11d3530d1754653bec12706785e707da4a98225b34a3ac4' +
                    'dbd658a32b960f1b882f18b6613bafcd0a325f0a702',
                'id': '8026c33c79251c5ddb9625c167096515a5001988ca1c8c3c2b2768f73fd05a8a'
            }
        };

        const SUCCESS = {
            'id': '8026c33c79251c5ddb9625c167096515a5001988ca1c8c3c2b2768f73fd05a8a',
            'type': TransactionType.DELEGATE,
            'createdAt': 0,
            'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
            'senderAddress': '17720385936796370956',
            'signature': 'f87770430f501b9817ae1274bc98c26ea9ddcd11d3530d1754653bec12706785e707da4a98225b34a3ac4dbd6' +
                '58a32b960f1b882f18b6613bafcd0a325f0a702',
            'fee': 1000000000,
            'salt': '768f92986c3c426ccb8d139e99aa9500',
            'asset': {
                'username': 'foo'
            }
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

