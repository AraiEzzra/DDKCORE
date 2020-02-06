import { expect } from 'chai';
import DDK, { WORKSPACE } from 'ddk.registry';
import { Account } from 'ddk.registry/dist/model/common/account';
import { COIN_MULTIPLIER } from 'ddk.registry/dist/config/const';
import { createAirdropReward } from 'ddk.registry/dist/util/arp/util';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { Fixture } from 'test/api/base/fixture';
import { socketRequest } from 'test/api/base';
import AccountRepository from 'core/repository/account';

describe('[API] Stake asset', () => {
    before(() => {
        DDK.initialize(WORKSPACE.DEVELOPMENT);

        const initilalARPBalance = 900_000;
        const ARPAccount = new Account({
            address: BigInt('17273227771820562781'),
            actualBalance: initilalARPBalance * COIN_MULTIPLIER
        });
        AccountRepository.add(ARPAccount);
    });

    it('Create for existing user', async () => {
        const SUCCESS = {
            amount: 100000000,
            startVoteCount: 0,
            airdropReward: {
                sponsors: {}
            },
        };
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.CREATE_STAKE_ASSET,
            body: { address: '4995063339468361088', amount: 100_000_000 }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });
});
