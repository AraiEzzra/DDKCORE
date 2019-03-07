import { Block } from 'shared/model/block';

export type DeletedBlockId = string;
export type RawBlock = {[key: string]: any};
export type BlockId = string;

export interface IBlockRepository {

    add(block: Block): Block;
    delete(block: Block): DeletedBlockId;
    deleteAfterBlock(blockId: BlockId): void;
    getById(blockId: BlockId): Block;
    getGenesisBlock(): Block;
    getLastBlock(): Block;
    getLastNBlockIds(): Array<BlockId>;
    getMany(offset: number, limit?: number): Array<Block>;
    isExist(blockId: BlockId): boolean;
    setLastBlock(block: Block): void;

}

export interface IBlockPGRepository {

    serialize(block: Block): RawBlock;
    deserialize(rawBlock: RawBlock): Block;

    deleteById(blockId: BlockId | Array<BlockId>): Promise<void>;
    deleteAfterBlock(blockId: BlockId): Promise<void>;
    getById(blockId: BlockId): Promise<Block>;
    getGenesisBlock(): Promise<Block>;
    getLastBlock(): Promise<Block>;
    getLastNBlockIds(): Promise<Array<BlockId>>;
    getMany(offset: number, limit?: number): Promise<Array<Block>>;
    isExist(blockId: BlockId): Promise<boolean>;
    saveOrUpdate(block: Block | Array<Block>): Promise<void>;

}
