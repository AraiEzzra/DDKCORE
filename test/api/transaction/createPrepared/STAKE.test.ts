import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetStake, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION STAKE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(), code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION, body: {
                'createdAt': 0,
                'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
                'senderAddress': '17720385936796370956',
                'type': TransactionType.STAKE,
                'salt': '0c7757e8c51b71c5d89fa79e56d12232',
                'asset': {
                    'amount': 10000000000,
                    'startTime': 104013582,
                    'startVoteCount': 0,
                    'airdropReward': {
                        'sponsors': []
                    }
                },
                'fee': 1000000,
                'signature': '0543484362f52200fed35ab7eb99a4cc752bcad96e244072fe46dc2cb05a59bccd0e78d18cd09ef6e76' +
                    '223a8dd2dea19bfa4eff0495900aad1dcb4a9d0f3460e',
                'id': '01d5ae1df9973595e4a8394ce97f71e7f5eccb87ccdb53ed8f58b714cca0386a'
            }
        };

        const SUCCESS = {
            'id': '01d5ae1df9973595e4a8394ce97f71e7f5eccb87ccdb53ed8f58b714cca0386a',
            'type': TransactionType.STAKE,
            'createdAt': 0,
            'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
            'senderAddress': '17720385936796370956',
            'signature': '0543484362f52200fed35ab7eb99a4cc752bcad96e244072fe46dc2cb05a59bccd0e78d18cd09ef6e76223a8dd' +
                '2dea19bfa4eff0495900aad1dcb4a9d0f3460e',
            'fee': 1000000,
            'salt': '0c7757e8c51b71c5d89fa79e56d12232',
            'asset': {
                'amount': 10000000000,
                'startTime': 104013582,
                'startVoteCount': 0,
                'airdropReward': {
                    'sponsors': []
                }
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetStake>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(), code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION, body: {
                'type': TransactionType.STAKE
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});




