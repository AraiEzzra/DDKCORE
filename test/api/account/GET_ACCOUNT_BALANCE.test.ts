import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';


describe('Test GET_ACCOUNT_BALANCE', () => {

    it('Positive', async () => {
        const SUCCESS = 171000000000000;

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
            body: { address: '933553974927686133' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.equal(SUCCESS);
    });

    it('Positive empty', async () => {
        const SUCCESS = 0;

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
            body: { address: '4995063339468361089' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.equal(SUCCESS);
    });

    it('Negative validate', async () => {

        const FAILED = ['IS NOT VALID REQUEST:\'GET_ACCOUNT_BALANCE\'... Missing required property: address'];

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
            body: {}
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});
