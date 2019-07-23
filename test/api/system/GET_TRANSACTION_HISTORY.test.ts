import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { ResponseTransactionHistory } from 'shared/model/types';

describe('Test GET_TRANSACTION_HISTORY', () => {
    it('Positive', async () => {
        const SUCCESS = [
            {
                action: 'APPLY_UNCONFIRMED',
                accountStateBefore: {
                    address: '4995063339468361088',
                    isDelegate: false,
                    publicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                    actualBalance: -126800080000000,
                    referrals: [],
                    votes: [],
                    stakes: []
                },
                accountStateAfter: {
                    address: '4995063339468361088',
                    isDelegate: false,
                    publicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                    actualBalance: -297800080000000,
                    referrals: [],
                    votes: [],
                    stakes: []
                }
            },
            {
                action: 'APPLY',
            },
        ];

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_TRANSACTION_HISTORY,
            body: { id: '9e805d3e4efb5e371a1f48beb8a95e6144cfd57681a47a55043daf897ba466ea' }
        };

        const response = await socketRequest<any, ResponseTransactionHistory>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.have.property('entity');
        expect(response.body.data.events).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {
        const EXPECTED = [
            'IS NOT VALID REQUEST:\'GET_TRANSACTION_HISTORY\'... Expected type object but found type string'
        ];

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_TRANSACTION_HISTORY,
            body: '9e805d3e4efb5e371a1f48beb8a95e6144cfd57681a47a55043daf897ba466ea',
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(EXPECTED);
    });
});
