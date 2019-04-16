import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetVote, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION VOTE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 103752042,
                'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'senderAddress': '4995063339468361088',
                'type': TransactionType.VOTE,
                'salt': '328798e18c9de5f7bb1dc81097dd6184',
                'asset': {
                    'votes': [
                        '+83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'
                    ],
                    'reward': 0,
                    'unstake': 0,
                    'airdropReward': {
                        'sponsors': []
                    }
                },
                'fee': 0,
                'signature': '6dee9e65b9cb7b3fc26f08cc3ad83bba6433f8558bc05828f944a26237aa7226102b153dea779f4136669' +
                    'b739cc98b5ac9f097528be52c1864a17e2001596b0a',
                'id': '97c1050ec926d9afaa2005ab69b1590f0875c8e13f7cd1a88d2d03ec12b947b8'
            }
        };

        const SUCCESS = {
            'id': '97c1050ec926d9afaa2005ab69b1590f0875c8e13f7cd1a88d2d03ec12b947b8',
            'type': TransactionType.VOTE,
            'createdAt': 103752042,
            'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            'senderAddress': '4995063339468361088',
            'signature': '6dee9e65b9cb7b3fc26f08cc3ad83bba6433f8558bc05828f944a26237aa7226102b153dea779f4136669b' +
                '739cc98b5ac9f097528be52c1864a17e2001596b0a',
            'fee': 0,
            'salt': '328798e18c9de5f7bb1dc81097dd6184',
            'asset': {
                'votes': ['+83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'],
                'reward': 0,
                'unstake': 0,
                'airdropReward': { 'sponsors': [] }
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetVote>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.VOTE
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});





