import TransactionRepo from 'core/repository/transaction/pg';
import { Block } from 'shared/model/block';
import db, { pgpE } from 'shared/driver/db/index';
import config from 'shared/config';
import queries from 'core/repository/queries/block';
import TransactionPGRepo from 'core/repository/transaction/pg';

import {
    BlockId, RawBlock,
    IBlockPGRepository as IBlockRepositoryPGShared
} from 'shared/repository/block';

import SharedBlockPgRepository from 'shared/repository/block/pg';
import { transactionSortFunc } from 'core/util/transaction';
import { ResponseEntity } from 'shared/model/response';

export interface IBlockPGRepository extends IBlockRepositoryPGShared {

}

class BlockPGRepo implements IBlockPGRepository {
    private tableName: string = 'block';
    private tableFields: Array<string> = [
        'id',
        'version',
        'created_at',
        'height',
        'previous_block_id',
        'transaction_count',
        'amount',
        'fee',
        'payload_hash',
        'generator_public_key',
        'signature'
    ];
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, { table: this.tableName });

    private async assignTransactions(blocks: Array<Block>): Promise<Array<Block>> {
        let totalTransactionCount = 0;
        const ids: Array<string> = blocks.map((block: Block) => {
            totalTransactionCount += block.transactionCount;
            return block.id;
        });
        if (!totalTransactionCount) {
            return blocks;
        }
        const transactions = await TransactionRepo.getByBlockIds(ids);
        blocks.forEach((block: Block) => {
            block.transactions = (transactions[block.id] || []).sort(transactionSortFunc);
        });
        return blocks;
    }

    async deleteById(blockId: BlockId | Array<BlockId>): Promise<ResponseEntity<Array<string>>> {
        const blockIds: Array<BlockId> = [].concat(blockId);
        try {
            const ids = await db.many(queries.deleteByIds, [blockIds]);
            return new ResponseEntity({ data: ids.map(rawId => rawId.id) });
        } catch (error) {
            return new ResponseEntity({
                errors: [`Unable to delete blocks ${JSON.stringify(blockIds)}. Error: ${error}`],
            });
        }

    }

    async getById(blockId: BlockId): Promise<Block> {
        const rawBlock: RawBlock = await db.oneOrNone(queries.getById, { blockId });

        if (!rawBlock) {
            return null;
        }

        let block: Block = SharedBlockPgRepository.deserialize(rawBlock);
        block = (await this.assignTransactions([block]))[0];
        return block;
    }

    async getGenesisBlock(): Promise<Block> {
        const rawBlock: RawBlock = await db.oneOrNone(queries.getGenesisBlock);
        if (!rawBlock) {
            return null;
        }
        let block: Block = SharedBlockPgRepository.deserialize(rawBlock);
        block = (await this.assignTransactions([block]))[0];
        return block;
    }

    async getLastBlock(): Promise<Block> {
        const rawBlock: RawBlock = await db.oneOrNone(queries.getLastBlock);
        if (!rawBlock) {
            return null;
        }
        let block: Block = SharedBlockPgRepository.deserialize(rawBlock);
        block = (await this.assignTransactions([block]))[0];
        return block;
    }

    async getLastNBlockIds(): Promise<Array<BlockId>> {
        const rawBlockIds: Array<{ id: string }> =
            await db.manyOrNone(queries.getLastNBlocks, { blockLimit: config.CONSTANTS.BLOCK_SLOT_WINDOW });
        if (!rawBlockIds || !rawBlockIds.length) {
            return null;
        }
        return rawBlockIds.map(block => block.id);
    }

    async getMany(limit: number = 0, offset: number = 0): Promise<Array<Block>> {
        const rawBlocks: Array<RawBlock> = await db.manyOrNone(queries.getMany(limit), { offset, limit });
        if (!rawBlocks || !rawBlocks.length) {
            return null;
        }
        let blocks: Array<Block> = rawBlocks.map(rawBlock => SharedBlockPgRepository.deserialize(rawBlock));
        blocks = await this.assignTransactions(blocks);
        return blocks;
    }

    async isExist(blockId: BlockId): Promise<boolean> {
        let response = await db.one(queries.isExist, { blockId });
        return response.exists;
    }

    async save(block: Block | Array<Block>): Promise<ResponseEntity<void>> {
        const blocks: Array<Block> = [].concat(block);
        const values: Array<object> = [];
        blocks.forEach((blockEntity) => {
            values.push(SharedBlockPgRepository.serialize(blockEntity));
        });
        const query = pgpE.helpers.insert(values, this.columnSet);

        try {
            await db.query(query);
        } catch (error) {
            return new ResponseEntity({
                errors: [
                    `Unable to save blocks with ids ${blocks.map(b => b.id)} to database. Error: ${error}`,
                ],
            });
        }

        return new ResponseEntity();
    }

    async batchSave(block: Block): Promise<ResponseEntity<void>> {
        const serializedBlock = SharedBlockPgRepository.serialize(block);

        try {
            db.tx(t => t.batch([
                t.none(pgpE.helpers.insert(serializedBlock, this.columnSet)),
                t.none(TransactionPGRepo.createInsertQuery(block.transactions)),
            ]));
        } catch (error) {
            return new ResponseEntity({
                errors: [
                    `Unable to save block with id ${block.id} to database. Error: ${error}`,
                ],
            });
        }

        return new ResponseEntity();
    }
}

export default new BlockPGRepo();
