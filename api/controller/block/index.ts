import { BlockModel } from 'shared/model/block';
import { RPC } from 'api/utils/decorators';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';
import BlockPGRepository from 'api/repository/block';
import { DEFAULT_LIMIT } from 'api/utils/common';
import { ResponseEntity } from 'shared/model/response';

const ALLOWED_FILTERS = new Set(['height']);
const ALLOWED_SORT = new Set(['height', 'createdAt']);

export class BlockController {

    constructor() {
        this.getBlock = this.getBlock.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_BLOCK)
    public async getBlock(message: Message, socket: any) {
        SocketMiddleware.emitToClient<BlockModel>(
            message.headers.id,
            message.code,
            new ResponseEntity<BlockModel>({ data: await BlockPGRepository.getOne(message.body.id) }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_BLOCKS)
    public async getBlocks(message: Message, socket: any) {
        const blocks = await BlockPGRepository.getMany(
            message.body.filter || {},
            message.body.sort || [['height', 'DESC']],
            message.body.limit || DEFAULT_LIMIT,
            message.body.offset || 0
        );

        SocketMiddleware.emitToClient<{ blocks: Array<BlockModel>, count: number }>(
            message.headers.id,
            message.code,
            new ResponseEntity({
                data: blocks
            }),
            socket
        );
    }

}

export default new BlockController();

