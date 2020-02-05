import { PublicKey, VoteType } from 'ddk.registry/dist/model/common/type';
import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { validate } from 'shared/validate';

export class AssetController {
    constructor() {
        this.createStakeAsset = this.createStakeAsset.bind(this);
        this.createVoteAsset = this.createVoteAsset.bind(this);
    }

    @RPC(API_ACTION_TYPES.CREATE_STAKE_ASSET)
    @validate()
    createStakeAsset(message: Message<{ address: string, amount: number }>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(API_ACTION_TYPES.CREATE_VOTE_ASSET)
    @validate()
    createVoteAsset(message: Message<{ address: string, votes: Array<PublicKey>, type: VoteType }>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }
}
