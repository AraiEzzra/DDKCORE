import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetStake, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_TRANSACTION STAKE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.STAKE,
                    'senderPublicKey': 'b4483a6b0677cda5e1fd6e508385ee654970db60e8c4c60ba2560c377e884527',
                    'senderAddress': '11911485691700170025',
                    'asset': {
                        'amount': 100000000
                    }
                },
                'secret': 'lumber network degree concert shadow protect violin aim scorpion clap busy plunge'
            }
        };

        const SUCCESS = {
            'type': TransactionType.STAKE,
            'senderPublicKey': 'b4483a6b0677cda5e1fd6e508385ee654970db60e8c4c60ba2560c377e884527',
            'senderAddress': '11911485691700170025',
            'fee': 10000,
            'asset': {
                'amount': 100000000,
                'startVoteCount': 0,
                'airdropReward': {
                    'sponsors': []
                }
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getTransactionData<IAssetStake>(response.body.data)).to.deep.equal(SUCCESS);
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

