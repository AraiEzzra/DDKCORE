import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetRegister, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION REGISTER', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 103667065,
                'senderPublicKey': '5366eb43bf46f651e0e7527f39a811773e4c4351e21712a1c525e4f24a098279',
                'senderAddress': '5475462032979311250',
                'type': TransactionType.REGISTER,
                'salt': 'ee1300500d42b88fee7e9c43c8ded89b',
                'asset': { 'referral': '4995063339468361088' },
                'fee': 0,
                'signature': 'f8f60f4c7b28f3e5ce96e27ba70fbf312304f429f091790642608aef7b61dc89eb24d839c3fc5ce' +
                    '2abe530e5c53cb331c326b086a360c496326fd48804d9cd06',
                'id': 'f031e51328f3282dd966403599797e207aad60b05649f53592244b2ced739d90'
            }
        };

        const SUCCESS = {
            'createdAt': 103667065,
            'senderPublicKey': '5366eb43bf46f651e0e7527f39a811773e4c4351e21712a1c525e4f24a098279',
            'senderAddress': '5475462032979311250',
            'type': TransactionType.REGISTER,
            'salt': 'ee1300500d42b88fee7e9c43c8ded89b',
            'asset': {
                'referral': '4995063339468361088'
            },
            'fee': 0,
            'signature': 'f8f60f4c7b28f3e5ce96e27ba70fbf312304f429f091790642608aef7b61dc89eb24d839c3fc5ce2abe530e5c5' +
                '3cb331c326b086a360c496326fd48804d9cd06',
            'id': 'f031e51328f3282dd966403599797e207aad60b05649f53592244b2ced739d90'
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetRegister>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.REGISTER
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});


