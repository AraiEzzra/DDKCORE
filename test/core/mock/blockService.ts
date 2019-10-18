import { Block } from 'shared/model/block';
import { timeService } from 'shared/util/timeServiceClient';

class MockBlockService {
    private lastBlock: Block = new Block({
        id: '3276517decd6171565151a3537e69c7e4f8d361050a4caf684dfcd796242757e',
        createdAt: timeService.getTime(),
        height: 1,
        previousBlockId: '001d6450cef6257f45171bbaff1d94bf1ddb912fb4c8d9ba0cfb4c4afcf88c2f',
        transactions: []
    });

    public getLastBlock(): Block {
        return this.lastBlock;
    }
}

export default new MockBlockService();
