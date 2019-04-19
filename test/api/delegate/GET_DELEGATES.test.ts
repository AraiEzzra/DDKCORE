import { Fixture } from 'test/api/base/fixture';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { expect } from 'chai';

describe('Test GET_DELEGATES', () => {

    const TOTAL_DELEGATES_COUNT = 3;

    it('GET_ALL_DELEGATES', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_DELEGATES,
            body: {
                limit: 10,
                offset: 0
            }
        };

        const SUCCESS = {
            'delegates': [
                {
                    'username': 'delegate3',
                    'missedBlocks': 0,
                    'forgedBlocks': 0,
                    'publicKey': '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
                    'votes': 0
                },
                {
                    'username': 'delegate1',
                    'missedBlocks': 0,
                    'forgedBlocks': 0,
                    'publicKey': '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
                    'votes': 0
                },
                {
                    'username': 'delegate2',
                    'missedBlocks': 0,
                    'forgedBlocks': 0,
                    'publicKey': 'f959e6c8d279c97d3ec5ba993f04ab740a6e50bec4aad75a8a1e7808a6c5eec7',
                    'votes': 0
                }
            ],
            'count': 3
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });

    it('GET_ONE_DELEGATE', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_DELEGATES,
            body: {
                limit: 1,
                offset: 0
            }
        };

        const SUCCESS = {
            'delegates': [
                {
                    'username': 'delegate3',
                    'missedBlocks': 0,
                    'forgedBlocks': 0,
                    'publicKey': '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
                    'votes': 0
                }
            ],
            'count': 3
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });

    it('GET EMPTY DELEGATES', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_DELEGATES,
            body: {
                limit: 10,
                offset: 5
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data.delegates).to.have.lengthOf(0);
        expect(response.body.data.count).to.equal(TOTAL_DELEGATES_COUNT);
        expect(response.body.errors).to.have.lengthOf(0);
    });

    it('Negative', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_DELEGATES,
            body: {
                offset: 0
            }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(
            ['IS NOT VALID REQUEST:\'GET_DELEGATES\'... Missing required property: limit']
        );
    });
});

