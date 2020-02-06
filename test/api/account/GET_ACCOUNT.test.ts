import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';

describe('Test GET_ACCOUNT', () => {

    it('Positive', async () => {

        const SUCCESS = {
            address: '3995920038576041585',
            publicKey: '',
            isDelegate: false,
            actualBalance: 100000000000,
            referrals: [],
            votes: [],
            stakes: [],
        };

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT,
            body: { address: '3995920038576041585' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });

    it('Positive empty', async () => {

        const SUCCESS = null;

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT,
            body: { address: '0000000000000000000' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });

    it('Positive delegate', async () => {

        const SUCCESS = {
            'address': '970429199431529547',
            'isDelegate': true,
            'publicKey': '80ede51ab3ca44ff66c9d5e0edebf2b0c94c8d09c5963bc8e80c7cdbb37a4914',
            'actualBalance': 99000000000,
            'referrals': [],
            'votes': [],
            'stakes': []
        };

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT,
            body: { address: '970429199431529547' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });

    it('Positive referrals', async () => {

        const SUCCESS = {
            'address': '11403542362421729442',
            'isDelegate': false,
            'publicKey': '385834ab939bbfb13f115baeb54c7d524f76256f853207f948c776c321181c44',
            'actualBalance': 0,
            'referrals': ['2875425441375077387'],
            'votes': [],
            'stakes': []
        };

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT,
            body: { address: '11403542362421729442' }
        };

        const response = await socketRequest(REQUEST);

        expect(true).to.equal(response.body.success);
        expect(SUCCESS).to.deep.equal(response.body.data);
    });

    it('Positive stakes', async () => {

        const SUCCESS = {
            address: '7396561962357959155',
            isDelegate: false,
            publicKey: '03c2741f6719392a94603062f7535416abbda71e1c1c5287f9417d3724d70ea1',
            actualBalance: 89999000000,
            referrals: [],
            votes: [],
            stakes: [{
                createdAt: 0,
                isActive: true,
                amount: 10000000000,
                voteCount: 0,
                nextVoteMilestone: 0,
                airdropReward: {
                    sponsors: {},
                },
                previousMilestones: [],
                sourceTransactionId: Buffer.from('2417a12ffff13cc6eff34d79791f908f5b52bc9976a1769fbf8bbdc3220c97d9', 'hex'),
            }]
        };

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT,
            body: { address: '7396561962357959155' }
        };

        const response = await socketRequest(REQUEST);

        expect(true).to.equal(response.body.success);
        expect(SUCCESS).to.deep.equal(response.body.data);
    });

    it('Positive votes', async () => {

        const SUCCESS = {
            address: '10775058514794264480',
            isDelegate: false,
            publicKey: 'b3d90f2d3b6aba2e6bcdcf3c1473c7f4365e3ceb15b682155136127606ab76c0',
            actualBalance: 89998000000,
            referrals: [],
            votes: [{
                username: 'delegate1',
                missedBlocks: 0,
                forgedBlocks: 0,
                publicKey: '83cb3d8641c8e73735cc1b70c915602ffcb6e5a68f14a71056511699050a1a05',
                votes: 2,
                confirmedVoteCount: 2,
                approval: 0,
            }],
            stakes: [{
                createdAt: 0,
                isActive: true,
                amount: 10000000000,
                voteCount: 1,
                nextVoteMilestone: 104008362,
                airdropReward: {
                    sponsors: {},
                },
                previousMilestones: [0],
                sourceTransactionId: Buffer.from('42d253826012103aec237eed68ca8093692bec7640df4359ea1e41a3240d100c', 'hex')
            }]
        };

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT,
            body: { address: '10775058514794264480' }
        };

        const response = await socketRequest(REQUEST);

        expect(true).to.equal(response.body.success);
        expect(SUCCESS).to.deep.equal(response.body.data);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(), code: API_ACTION_TYPES.GET_ACCOUNT, body: {}
        };

        const FAILED = ['IS NOT VALID REQUEST:\'GET_ACCOUNT\'... Missing required property: address'];

        const response = await socketRequest(REQUEST);

        expect(false).to.equal(response.body.success);
        expect(FAILED).to.deep.equal(response.body.errors);
    });
});
