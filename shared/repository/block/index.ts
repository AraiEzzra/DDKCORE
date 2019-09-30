import { Block } from 'shared/model/block';
import { ResponseEntity } from 'shared/model/response';

export type RawBlock = { [key: string]: any };
export type BlockId = string;

export interface IBlockRepository {
    add(block: Block): Block;
    getGenesisBlock(): Block;
    getLastBlock(): Block;
    getMany(required: number, offset: number): Array<Block>;
    has(blockId: BlockId): boolean;
}

export interface IBlockPGRepository {

    deleteById(blockId: BlockId | Array<BlockId>): Promise<ResponseEntity<Array<string>>>;
    getById(blockId: BlockId): Promise<Block>;
    getGenesisBlock(): Promise<Block>;
    getLastBlock(): Promise<Block>;
    getLastNBlockIds(): Promise<Array<BlockId>>;
    getMany(limit: number, offset: number): Promise<ResponseEntity<Array<Block>>>;
    isExist(blockId: BlockId): Promise<boolean>;
    save(block: Block | Array<Block>): Promise<ResponseEntity<void>>;

}
