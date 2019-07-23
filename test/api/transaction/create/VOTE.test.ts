import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetStake, TransactionType, IAssetVote, Transaction } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION VOTE', () => {

    it('Positive', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.VOTE,
                    'senderPublicKey': '44c3d8f32cd0d537800db2a66892af2a5ced6c40ca69f991d633ece59ddd4880',
                    'senderAddress': '3832834549593264844',
                    'asset': {
                        'votes': [
                            '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'
                        ],
                        'type': '+'
                    }
                },
                'secret': 'region again shield depart fashion token ecology enhance alarm rail choice garlic'
            }
        };

        const SUCCESS = {
            'type': TransactionType.VOTE,
            'senderPublicKey': '44c3d8f32cd0d537800db2a66892af2a5ced6c40ca69f991d633ece59ddd4880',
            'senderAddress': '3832834549593264844',
            'fee': 1000000,
            'asset': {
                'votes': ['+83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'],
                'reward': 0,
                'unstake': 0,
                'airdropReward': {
                    'sponsors': []
                }
            }
        };

        const response = await socketRequest<any, Transaction<IAssetVote>>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getTransactionData<IAssetVote>(response.body.data)).to.deep.equal(SUCCESS);
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
