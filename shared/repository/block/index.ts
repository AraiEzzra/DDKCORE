import { Block } from 'shared/model/block';

export type DeletedBlockId = string;
export type RawBlock = {[key: string]: any};
export type BlockId = string;

export interface IBlockRepository {

    add(block: Block): Block;
    getGenesisBlock(): Block;
    getLastBlock(): Block;
    getMany(required: number, offset: number): Array<Block>;
    isExist(blockId: BlockId): boolean;
}

export interface IBlockPGRepository {

    serialize(block: Block): RawBlock;
    deserialize(rawBlock: RawBlock): Block;

    deleteById(blockId: BlockId | Array<BlockId>): Promise<Array<string>>;
    getById(blockId: BlockId): Promise<Block>;
    getGenesisBlock(): Promise<Block>;
    getLastBlock(): Promise<Block>;
    getLastNBlockIds(): Promise<Array<BlockId>>;
    getMany(limit: number, offset: number): Promise<Array<Block>>;
    isExist(blockId: BlockId): Promise<boolean>;
    saveOrUpdate(block: Block | Array<Block>): Promise<void>;

}
