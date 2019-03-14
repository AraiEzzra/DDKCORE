import { Block } from 'shared/model/block';
import { ResponseEntity } from 'shared/model/response';

class MockBlockService {
    public async loadBlocksOffset(param: {offset: number, limit?: number}): Promise<ResponseEntity<Array<Block>>> {
        let blocks: Array<Block> = [];
      
        return new ResponseEntity({ data: blocks });
    }
}

export default new MockBlockService();
