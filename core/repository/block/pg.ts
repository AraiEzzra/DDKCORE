import TransactionRepo from 'core/repository/transaction/pg';
import { Block } from 'shared/model/block';
import db, { pgpE } from 'shared/driver/db/index';
import config from 'shared/util/config';
import queries from 'core/repository/queries/block';

import {
    BlockId, RawBlock,
    IBlockPGRepository as IBlockRepositoryPGShared
} from 'shared/repository/block';
import {TransactionsByBlockResponse} from 'shared/repository/transaction/transaction';

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
    private readonly columnSet = new pgpE.helpers.ColumnSet(this.tableFields, {table: this.tableName});

    serialize(block: Block): RawBlock {
        return {
            id: block.id,
            version: block.version,
            created_at: block.createdAt,
            height: block.height,
            previous_block_id: block.previousBlockId,
            transaction_count: block.transactionCount,
            amount: block.amount,
            fee: block.fee,
            payload_hash: block.payloadHash,
            generator_public_key: block.generatorPublicKey,
            signature: block.signature
        };
    }
    
    deserialize(rawBlock: RawBlock, radix: number = 10): Block {
        return new Block({
            id: rawBlock.id,
            version: parseInt(rawBlock.version, radix),
            createdAt: parseInt(rawBlock.created_at, radix),
            height: parseInt(rawBlock.height, radix),
            previousBlockId: rawBlock.previous_block_id,
            transactionCount: parseInt(rawBlock.transaction_count, radix),
            amount: rawBlock.amount,
            fee: rawBlock.fee,
            payloadHash: rawBlock.payload_hash,
            generatorPublicKey: rawBlock.generator_public_key,
            signature: rawBlock.signature
        });
    }

    private async assignTransactions(blocks: Array<Block>): Promise<Array<Block>> {
        let totalTransactionCount = 0;
        const ids: Array<string> = blocks.map((block: Block) => {
            totalTransactionCount += block.transactionCount;
            return block.id;
        });
        if (!totalTransactionCount) {
            return blocks;
        }
        const transactions: TransactionsByBlockResponse = await TransactionRepo.getByBlockIds(ids);
        blocks.forEach((block: Block) => {
            if (transactions[block.id]) {
                block.transactions = transactions[block.id];
            }
        });
        return blocks;
    }

    async deleteById(blockId: BlockId | Array<BlockId>): Promise<void> {
        const blockIds: Array<BlockId> = [].concat(blockId);
        await db.none(queries.deleteByIds, [blockIds]);
    }

    async deleteAfterBlock(blockId: BlockId): Promise<void> {
        await db.none(queries.deleteAfterBlock, blockId);
    }


    async getById(blockId: BlockId): Promise<Block> {
        const rawBlock: RawBlock = await db.oneOrNone(queries.getById, { blockId });

        if (!rawBlock) {
            return null;
        }

        let block: Block = this.deserialize(rawBlock);
        block = this.assignTransactions([block])[0];
        return block;
    }

    async getGenesisBlock(): Promise<Block> {
        const rawBlock: RawBlock = await db.oneOrNone(queries.getGenesisBlock);
        if (!rawBlock) {
            return null;
        }
        let block: Block = this.deserialize(rawBlock);
        block = this.assignTransactions([block])[0];
        return block;
    }

    async getLastBlock(): Promise<Block> {
        const rawBlock: RawBlock = await db.oneOrNone(queries.getLastBlock);
        if (!rawBlock) {
            return null;
        }
        let block: Block = this.deserialize(rawBlock);
        block = this.assignTransactions([block])[0];
        return block;
    }

    async getLastNBlockIds(): Promise<Array<BlockId>> {
        const rawBlockIds: Array<{id: string}> =
            await db.manyOrNone(queries.getLastNBlocks, { blockLimit: config.constants.blockSlotWindow});
        if (!rawBlockIds || !rawBlockIds.length) {
            return null;
        }
        return rawBlockIds.map(block => block.id);
    }

    async getMany(offset: number, limit?: number): Promise<Array<Block>> {
        const requestLimit = limit || -1;
        const rawBlocks: Array<RawBlock> = await db.manyOrNone(queries.getMany(requestLimit), { offset, limit });
        if (!rawBlocks || !rawBlocks.length) {
            return null;
        }
        let blocks: Array<Block> = rawBlocks.map(rawBlock => this.deserialize(rawBlock));
        blocks = await this.assignTransactions(blocks);
        return blocks;
    }

    async isExist(blockId: BlockId): Promise<boolean> {
        let exists = await db.oneOrNone(queries.isExist, { blockId });
        return exists === 't';
    }

    async saveOrUpdate(block: Block | Array<Block>): Promise<void> {
        const blocks: Array<Block> = [].concat(block);
        const values: Array<object> = [];
        blocks.forEach((blockEntity) => {
            values.push(this.serialize(blockEntity));
        });
        const query = pgpE.helpers.insert(values, this.columnSet) +
            ' ON CONFLICT(id) DO UPDATE SET ' +
            this.columnSet.assignColumns({from: 'EXCLUDED', skip: 'id'});
        await db.none(query);
        return null;
    }
}

export default new BlockPGRepo();
