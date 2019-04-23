import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetStake, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION STAKE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 103662553,
                'senderPublicKey': '04b3e3318ad30573b8e78c7920f007ca88bbd9a13c2b708b56b705d872e7ebc0',
                'senderAddress': '13866654931132093576',
                'type': TransactionType.STAKE,
                'salt': 'cf45b312af7aac3324b3432889442643',
                'asset': {
                    'amount': 100000000,
                    'startTime': 103662553,
                    'startVoteCount': 0,
                    'airdropReward': { 'sponsors': [['4995063339468361088', 10000000]] }
                },
                'fee': 10000,
                'signature': '3c18f669619ea46d15feab827aa2aa6d149700c56d3709ba7b79545d0e2cedb6b2a868c8db373aba6f' +
                    '3d69804fb5d756871207aa8c4bb257cf2eaca53b861e00',
                'id': '4b2bc36b8242acc65bdf60c906532dd7f7c77024b300db6ea8c209de72ac3917'
            }
        };

        const SUCCESS = {
            'type': TransactionType.STAKE,
            'createdAt': 103662553,
            'senderPublicKey': '04b3e3318ad30573b8e78c7920f007ca88bbd9a13c2b708b56b705d872e7ebc0',
            'senderAddress': '13866654931132093576',
            'salt': 'cf45b312af7aac3324b3432889442643',
            'asset': {
                'amount': 100000000,
                'startTime': 103662553,
                'startVoteCount': 0,
                'airdropReward': {
                    'sponsors': [
                        [
                            '4995063339468361088',
                            10000000
                        ]
                    ]
                }
            },
            'fee': 10000,
            'signature': '3c18f669619ea46d15feab827aa2aa6d149700c56d3709ba7b79545d0e2cedb6b2a868c8db' +
                '373aba6f3d69804fb5d756871207aa8c4bb257cf2eaca53b861e00',
            'id': '4b2bc36b8242acc65bdf60c906532dd7f7c77024b300db6ea8c209de72ac3917'
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetStake>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.STAKE
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});




