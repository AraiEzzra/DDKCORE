import { expect } from 'chai';

import { Fixture } from 'test/api/base/fixture';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';

describe('Test GET_CURRENT_ROUND', () => {
    it('Positive', async () => {
        const SUCCESS = null;

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_CURRENT_ROUND,
            body: {},
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });
});
