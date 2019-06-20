import { BlockModel } from 'shared/model/block';
import { RPC } from 'api/utils/decorators';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import SocketMiddleware from 'api/middleware/socket';
import BlockPGRepository from 'api/repository/block';
import { DEFAULT_LIMIT, Pagination, Sort } from 'api/utils/common';
import { ResponseEntity } from 'shared/model/response';
import { validate } from 'shared/validate';
import { Message } from 'shared/model/message';
import { BlockId } from 'shared/repository/block';

export class BlockController {

    constructor() {
        this.getBlock = this.getBlock.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
        this.getBlockByHeight = this.getBlockByHeight.bind(this);
        this.getLastBlock = this.getLastBlock.bind(this);
    }

    @RPC(API_ACTION_TYPES.GET_BLOCK)
    @validate()
    public async getBlock(message: Message<{ id: BlockId }>, socket: any) {
        SocketMiddleware.emitToClient<BlockModel>(
            message.headers.id,
            message.code,
            new ResponseEntity<BlockModel>({ data: await BlockPGRepository.getOne(message.body.id) }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_BLOCK_BY_HEIGHT)
    @validate()
    public async getBlockByHeight(message: Message<{ height: number }>, socket: any) {
        SocketMiddleware.emitToClient(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: await BlockPGRepository.getByHeight(message.body.height) }),
            socket
        );
    }
    
    @RPC(API_ACTION_TYPES.GET_LAST_BLOCK)
    @validate()
    public async getLastBlock(message: Message<{}>, socket: any) {
        SocketMiddleware.emitToClient(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: await BlockPGRepository.getLastBlock() }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_BLOCKS)
    @validate()
    public async getBlocks(message: Message<Pagination & { filter: any, sort: Array<Sort> }>, socket: any) {
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

