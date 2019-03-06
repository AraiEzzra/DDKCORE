import { Block } from 'shared/model/block';
import BlockRepository from '../repository/block';
import Response from 'shared/model/response';

export interface IBlockRequest {
    limit: number;
    offset: number;
    sort?: string;
}

@Controller('block')
class BlockController {
    @SOCKET('get_many')
    public getBlocks(data?: IBlockRequest) {
        const blocks: Response<{ amount: number, blocks: Array<Block>}> = BlockRepository.getMany();
        return blocks.data;
    }

    @SOCKET('get_one')
    @validate('getBlock')
    public getBlock(data) {
        const block: Response<Block> = BlockRepository.getOne(data);
        return block.data;
    }
}

export default new BlockController();

