import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';

describe('Test GET_BLOCK_HISTORY', () => {
    it('Positive', async () => {
        const SUCCESS = [{ action: 'PROCESS' }, { action: 'APPLY' }]

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_BLOCK_HISTORY,
            body: { id: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.have.property('entity');
        expect(response.body.data.events).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {
        const EXPECTED = [
            'IS NOT VALID REQUEST:\'GET_BLOCK_HISTORY\'... Expected type object but found type string'
        ];

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_BLOCK_HISTORY,
            body: '9e805d3e4efb5e371a1f48beb8a95e6144cfd57681a47a55043daf897ba466ea',
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(EXPECTED);
    });
});
