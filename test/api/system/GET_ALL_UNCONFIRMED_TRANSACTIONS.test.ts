import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';

describe('Test GET_ALL_UNCONFIRMED_TRANSACTIONS', () => {
    it('Positive empty', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ALL_UNCONFIRMED_TRANSACTIONS,
            body: { limit: 1, offset: 0 }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal({ transactions: [], count: 0 });
    });

});
