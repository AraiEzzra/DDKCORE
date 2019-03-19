import { Block } from 'shared/model/block';
import BlockService from 'api/service/block';
import { ResponseEntity } from 'shared/model/response';
import { RPC } from 'api/utils/decorators';
import { GET_BLOCK_BY_ID, GET_BLOCKS_HISTORY } from 'shared/driver/socket/codes';
import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';

export class BlockController {

    constructor() {
        this.getBlocksHistory = this.getBlocksHistory.bind(this);
        this.getBlock = this.getBlock.bind(this);
    }

    @RPC(GET_BLOCKS_HISTORY)
    public getBlocksHistory(message: Message, socket: any) {
        const { body, headers, code } = message;
        const blocksResponse: ResponseEntity<Array<Block>> = BlockService.getMany(body);

        SocketMiddleware.emitToClient(headers.id, code, blocksResponse, socket);
    }

    @RPC(GET_BLOCK_BY_ID)
    public getBlock(message: Message, socket: any) {

        const { body, headers, code } = message;
        const blocksResponse: ResponseEntity<Block> = BlockService.getOne(body);

        SocketMiddleware.emitToClient(headers.id, code, blocksResponse, socket);
    }
}

export default new BlockController();

