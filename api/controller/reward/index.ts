import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ResponseEntity } from 'shared/model/response';
import { Reward, StakeReward } from 'shared/model/reward';
import { validate } from 'shared/validate';
import { Pagination } from 'shared/util/common';
import TransactionRepository from 'api/repository/transaction';

export class RewardController {

    constructor() {
        this.getStakeRewards = this.getStakeRewards.bind(this);
        this.getAirdropRewards = this.getAirdropRewards.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_STAKE_REWARDS)
    @validate()
    async getStakeRewards(message: Message<{ senderPublicKey: string } & Pagination>, socket: any) {
        const { senderPublicKey, limit, offset } = message.body;
        const transactions = await TransactionRepository.getVotesWithStakeReward(senderPublicKey, limit, offset);

        SocketMiddleware.emitToClient(
            message.headers.id,
            message.code,
            new ResponseEntity<{ count: number, rewards: Array<StakeReward> }>({
                data: {
                    count: transactions.count,
                    rewards: transactions.transactions.map(trs => new StakeReward({
                        createdAt: trs.createdAt,
                        amount: trs.asset.reward
                    }))
                }
            }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_AIRDROP_REWARDS)
    @validate()
    getAirdropRewards(message: Message<{ address: string } & Pagination>, socket: any) {
        SocketMiddleware.emitToClient(
            message.headers.id,
            message.code,
            new ResponseEntity<{ count: number, rewards: Array<Reward> }>({ data: { count: 0, rewards: [] } }),
            socket
        );
    }
}

export default new RewardController();
