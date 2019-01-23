import { Block } from 'shared/model/block';

interface ILoadBlockParams {
    limit: number;
    lastId: string;
}

export class BlockService {
    private lastBlock: Block;


    public loadBlocksData(params: ILoadBlockParams) : Block[] {
        return [];
    }

    public getLastBlock(): Block {
        return this.lastBlock;
    }

    public setLastBlock(block: Block): Block {
        this.lastBlock = block;
        return this.lastBlock;
    }

    public isLastBlockFresh(): boolean {
        return true;
    }


}
