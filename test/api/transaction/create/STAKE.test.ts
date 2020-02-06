import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { getTransactionData } from 'test/api/base/util';
import { IAssetStake, TransactionType, Transaction } from 'shared/model/transaction';
import DDK, { WORKSPACE } from 'ddk.registry';
import { Account } from 'ddk.registry/dist/model/common/account';
import { COIN_MULTIPLIER } from 'ddk.registry/dist/config/const';
import AccountRepository from 'core/repository/account';

describe('Test CREATE_TRANSACTION STAKE', () => {
    before(() => {
        DDK.initialize(WORKSPACE.DEVELOPMENT);

        const initilalARPBalance = 900_000;
        const ARPAccount = new Account({
            address: BigInt('17273227771820562781'),
            actualBalance: initilalARPBalance * COIN_MULTIPLIER
        });
        AccountRepository.add(ARPAccount);
    });

    it('Positive', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {
                'trs': {
                    'type': TransactionType.STAKE,
                    'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
                    'senderAddress': '17720385936796370956',
                    'asset': {
                        'amount': 100000000
                    }
                },
                'secret': 'region again shield depart fashion token ecology enhance alarm rail choice garlic'
            }
        };

        const SUCCESS = {
            'type': TransactionType.STAKE,
            'senderPublicKey': 'ddef0a8a7fe290ca950fd74d83d31f4a32b014d0b675636cf6573cf434ef524f',
            'senderAddress': '17720385936796370956',
            'fee': 10000,
            'asset': {
                'amount': 100000000,
                'startVoteCount': 0,
                'airdropReward': {
                    'sponsors': []
                }
            }
        } as any;

        const response = await socketRequest<any, Transaction<IAssetStake>>(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(getTransactionData<IAssetStake>(response.body.data)).to.deep.equal(SUCCESS);
    });

    it('Negative', async () => {

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_TRANSACTION,
            body: {}
        };

        const FAILED = ['IS NOT VALID REQUEST:\'CREATE_TRANSACTION\'... Reference could not be resolved:' +
            ' CREATE_TRANSACTION'];

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(FAILED);
    });
});
