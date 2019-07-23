import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetVote, TransactionType, Transaction } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION VOTE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 0,
                'senderPublicKey': '44c3d8f32cd0d537800db2a66892af2a5ced6c40ca69f991d633ece59ddd4880',
                'senderAddress': '3832834549593264844',
                'type': TransactionType.VOTE,
                'salt': '816af28b2a6c10655269d81d78eb628a',
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
                'signature': '27a5d0b08d943357489ba574a8bf6e7a8c04e4474f6f241369801df71dd20c1fe29b9b4e18cab1a6ca262' +
                    'dae055b7070b13dc802e761bc315ee2e8c78e0f6107',
                'id': '96a7c7c428571cb105b5396170bdf1508eb5e4b32723f91323b947462e55a0c1'
            }
        };

        const SUCCESS = {
            'id': '96a7c7c428571cb105b5396170bdf1508eb5e4b32723f91323b947462e55a0c1',
            'type': TransactionType.VOTE,
            'createdAt': 0,
            'senderPublicKey': '44c3d8f32cd0d537800db2a66892af2a5ced6c40ca69f991d633ece59ddd4880',
            'senderAddress': '3832834549593264844',
            'signature': '27a5d0b08d943357489ba574a8bf6e7a8c04e4474f6f241369801df71dd20c1fe29b9b4e18cab1a6ca262dae05' +
                '5b7070b13dc802e761bc315ee2e8c78e0f6107',
            'fee': 0,
            'salt': '816af28b2a6c10655269d81d78eb628a',
            'asset': {
                'votes': [
                    '+83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05'
                ],
                'reward': 0,
                'unstake': 0,
                'airdropReward': {
                    'sponsors': []
                }
            }
        };

        const response = await socketRequest<any, Transaction<IAssetVote>>(REQUEST);

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
