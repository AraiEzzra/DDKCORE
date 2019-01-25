import { Block } from 'shared/model/block';

export class BlockRepo {

    constructor() {}

    public getGenesisBlock(): Block {
        return undefined;
    }

    public countList(where, params): number { return undefined; }

    public list(filter, params): Block[] { return undefined; }

    public deleteBlock(blockId: string): void {}

    public getIdSequence(param: { height: number, delegetes: [], limit: number}) {}

    public getCommonBlock(param: {id: string, previousBlock: Block, height: number}): Block { return undefined; }

    public loadBlocksOffset(param: {}): object[] { return undefined; }

    public loadLastBlock(): Block { return undefined; }

    public loadBlockByHeight(height: number): Block { return undefined; }

    public aggregateBlocksReward(filter: object): { fees: number, rewards: number, count: number} { return undefined; }

    public loadLastNBlocks(): string[] {
        // return array of ids
        return undefined;
    }

    public deleteAfterBlock(id: string): void { return undefined; }

    public loadBlocksData() {}
}
