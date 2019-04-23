import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetStake, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION VOTE', () => {

    it('Positive', async () => {
        const REQUEST_STAKE = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.SEND,
                    'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                    'senderAddress': '4995063339468361088',
                    'asset': {
                        'amount': 100000000000
                    }
                },
                'secret': 'hen worry two thank unfair salmon smile oven gospel grab latin reason'
            }
        };

        const REQUEST_VOTE = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.VOTE,
                    'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                    'senderAddress': '4995063339468361088',
                    'asset': {
                        'votes': [
                            '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'
                        ],
                        'type': '+'
                    }
                },
                'secret': 'hen worry two thank unfair salmon smile oven gospel grab latin reason'
            }
        };

        const SUCCESS = {
            'type': TransactionType.VOTE,
            'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            'senderAddress': '4995063339468361088',
            'fee': 0,
            'asset': {
                'votes': ['+83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'],
                'reward': 0,
                'unstake': 0,
                'airdropReward': { 'sponsors': [] }
            }
        };

        const responseStake = await socketRequest(REQUEST_STAKE);
        const responseVote = await socketRequest(REQUEST_VOTE);

        expect(responseVote.body.success).to.equal(true);
        expect(getTransactionData<IAssetStake>(responseVote.body.data)).to.deep.equal(SUCCESS);
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
