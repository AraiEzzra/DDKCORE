import { RPC } from 'api/utils/decorators';
import { Message2 } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ResponseEntity } from 'shared/model/response';
import { Reward } from 'shared/model/reward';

export class RewardController {

    constructor() {
        this.getStakeRewards = this.getStakeRewards.bind(this);
        this.getAirdropRewards = this.getAirdropRewards.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_STAKE_REWARDS)
    getStakeRewards(message: Message2<{ address: string }>, socket: any) {
        SocketMiddleware.emitToClient(
            message.headers.id,
            message.code,
            new ResponseEntity<{ count: number, rewards: Array<Reward> }>({ data: { count: 0, rewards: [] } }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_AIRDROP_REWARDS)
    getAirdropRewards(message: Message2<{ address: string }>, socket: any) {
        SocketMiddleware.emitToClient(
            message.headers.id,
            message.code,
            new ResponseEntity<{ count: number, rewards: Array<Reward> }>({ data: { count: 0, rewards: [] } }),
            socket
        );
    }
}

export default new RewardController();
