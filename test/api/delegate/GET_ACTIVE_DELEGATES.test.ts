import { Fixture } from 'test/api/base/fixture';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import config from 'shared/config';
import { ResponseActiveDelegates } from 'shared/model/types';

const chai = require('chai'),
    expect = chai.expect; // preference and tested with expect
chai.use(require('chai-sorted'));

describe('Test GET_ACTIVE_DELEGATES', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
            body: { limit: 2, offset: 0 },
        };

        const response = await socketRequest<any, ResponseActiveDelegates>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data.delegates).to.be.descendingBy('votes');
        expect(response.body.data.count).to.equal(config.CONSTANTS.ACTIVE_DELEGATES.get(0));
    });

    it('DESC username sorting', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
            body: { limit: 2, offset: 0, sort: [['username', 'DESC']] },
        };

        const response = await socketRequest<any, ResponseActiveDelegates>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data.delegates).to.be.descendingBy('username');
        expect(response.body.data.count).to.equal(config.CONSTANTS.ACTIVE_DELEGATES.get(0));
    });

    it('DESC approval sorting', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
            body: { limit: 2, offset: 0, sort: [['approval', 'DESC']] },
        };

        const response = await socketRequest<any, ResponseActiveDelegates>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data.delegates).to.be.descendingBy('approval');
        expect(response.body.data.count).to.equal(config.CONSTANTS.ACTIVE_DELEGATES.get(0));
    });

    it('Empty', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
            body: { limit: 10, offset: 5 },
        };

        const response = await socketRequest<any, ResponseActiveDelegates>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data.delegates).to.have.lengthOf(0);
        expect(response.body.data.count).to.equal(config.CONSTANTS.ACTIVE_DELEGATES.get(0));
        expect(response.body.errors).to.equal(undefined);
    });

    it('Negative', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
            body: { offset: 0, limit: -123 },
        };

        const response = await socketRequest<any, ResponseActiveDelegates>(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(
            ['IS NOT VALID REQUEST:\'GET_ACTIVE_DELEGATES\'... Value -123 is less than minimum 1']
        );
    });
});
