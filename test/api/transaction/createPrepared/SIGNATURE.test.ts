import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getPreparedTransactionData } from 'test/api/base/util';
import { IAssetSignature, TransactionType } from 'shared/model/transaction';

describe('Test CREATE_PREPARED_TRANSACTION SIGNATURE', () => {

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'createdAt': 103680787,
                'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'senderAddress': '4995063339468361088',
                'type': TransactionType.SIGNATURE,
                'salt': 'c4e0c6a35cbf7f1dc3f91a176c687250',
                'asset': {
                    'publicKey': '74832421fdd0023c33ba323ae2618e5651e73c0463130eb31912c158fb85d744'
                },
                'fee': 1000000,
                'signature': '03f5469dadbc841363b7f4ed24db446ec4cfff757dc389c811378c87e170177f5c08acaa84c9f5ff9' +
                    'a1bd74142b2b750026bfb127d1098bec109b142dd70dd0f',
                'secondSignature': '5caf9d53a11122c9ebef20f2df63574a495aca013943e7c7ec32ccf2b61cd1e09315d04fd07d2' +
                    'ebe93a26bb2fb04626724ec4a9ed67e982b7800637d450eee02',
                'id': 'e94b19d4036296c422e98040de3d22db4161786217c557feb3e06a4809320d3c'
            }
        };

        const SUCCESS = {
            'fee': 1000000,
            'senderAddress': '4995063339468361088',
            'id': 'e94b19d4036296c422e98040de3d22db4161786217c557feb3e06a4809320d3c',
            'type': TransactionType.SIGNATURE,
            'createdAt': 103680787,
            'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            'signature': '03f5469dadbc841363b7f4ed24db446ec4cfff757dc389c811378c87e170177f5c08acaa84c9f5ff9a1bd' +
                '74142b2b750026bfb127d1098bec109b142dd70dd0f',
            'secondSignature': '5caf9d53a11122c9ebef20f2df63574a495aca013943e7c7ec32ccf2b61cd1e09315d04fd07d2ebe93a2' +
                '6bb2fb04626724ec4a9ed67e982b7800637d450eee02',
            'salt': 'c4e0c6a35cbf7f1dc3f91a176c687250',
            'asset': { 'publicKey': '74832421fdd0023c33ba323ae2618e5651e73c0463130eb31912c158fb85d744' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getPreparedTransactionData<IAssetSignature>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION,
            body: {
                'type': TransactionType.SIGNATURE
            }
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_PREPARED_TRANSACTION\'... Missing required property: asset'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});



