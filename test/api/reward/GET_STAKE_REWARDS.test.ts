import { BASE_ACCOUNT, Fixture } from 'test/api/base/fixture';
import { TransactionType } from 'shared/model/transaction';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getSocket } from 'test/api/base';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { expect } from 'chai';
import { StakeReward } from 'shared/model/reward';

describe('Test GET_STAKE_REWARDS', () => {
    context('Add one block and two vote trs (one with reward, one without reward', async () => {
        let block, trs, trsWithReward;

        before(async () => {
            block = await Fixture.createBlock();
            trs = await Fixture.createTransaction(TransactionType.VOTE, block.id, {
                reward: 0,
                type: '+',
                airdropReward: {
                    sponsors: []
                },
                unstake: 0,
                votes: [BASE_ACCOUNT.publicKey]
            });
            trsWithReward = await Fixture.createTransaction(TransactionType.VOTE, block.id, {
                reward: 100,
                type: '+',
                airdropReward: {
                    sponsors: []
                },
                unstake: 0,
                votes: [BASE_ACCOUNT.publicKey]
            });
        });

        it('Positive ', (done) => {
            const HEADERS = Fixture.getBaseHeaders();
            const SUCCESS = {
                headers: HEADERS,
                code: API_ACTION_TYPES.GET_STAKE_REWARDS,
                body: {
                    senderPublicKey: BASE_ACCOUNT.publicKey,
                    limit: 10,
                    offset: 0
                }
            };

            const socket = getSocket();
            socket.emit('message', SUCCESS);
            socket.on('message', (response: Message<ResponseEntity<{
                rewards: Array<StakeReward>, count: number
            }>>) => {
                if (response.headers.id === HEADERS.id) {
                    console.log(JSON.stringify(response.body));


                    expect(response.body.success).to.equal(true);
                    expect(response.body.data.count).to.equal(1);
                    expect(response.body.data.rewards[0].amount).to.equal(100);
                    expect(response.body.data.rewards[0].createdAt).to.equal(trsWithReward.createdAt);

                    socket.close();
                    done();
                }
            });
        });

        after(async () => {
            await Fixture.removeTransaction(trs.id);
            await Fixture.removeTransaction(trsWithReward.id);
            await Fixture.removeBlock(block.id);
        });


    });

    it('Negative', () => {

    });
});
