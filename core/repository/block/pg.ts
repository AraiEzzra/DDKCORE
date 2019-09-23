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
import { AddressToTransactionPGRepo } from 'core/repository/addressToTransaction/pg';
import { TransactionType } from 'shared/model/transaction';

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

    private async assignTransactions(
        blocks: Array<Block>,
    ): Promise<ResponseEntity<Array<Block>>> {
        let totalTransactionCount = 0;
        const ids: Array<string> = blocks
            .filter(block => block.transactionCount !== 0)
            .map((block: Block) => {
                totalTransactionCount += block.transactionCount;
                return block.id;
            });
        if (!totalTransactionCount) {
            return new ResponseEntity({ data: blocks });
        }

        const transactionsResponse = await TransactionRepo.getByBlockIds(ids);
        if (!transactionsResponse.success) {
            return new ResponseEntity({ errors: [
                ...transactionsResponse.errors,
                'assignTransactions',
            ] });
        }

        const transactions = transactionsResponse.data;
        blocks.forEach((block: Block) => {
            block.transactions = (transactions[block.id] || []).sort(transactionSortFunc);
        });

        return new ResponseEntity({ data: blocks });
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

    async getMany(limit: number = 0, offset: number = 0): Promise<ResponseEntity<Array<Block>>> {
        try {
            const rawBlocks: Array<RawBlock> = await db.manyOrNone(
                queries.getMany(limit),
                { offset, limit },
            );
            if (!rawBlocks || !rawBlocks.length) {
                return new ResponseEntity({ data: [] });
            }

            const blocks = rawBlocks.map(rawBlock => SharedBlockPgRepository.deserialize(rawBlock));
            const blocksWithTrsResponse = await this.assignTransactions(blocks);
            if (!blocksWithTrsResponse.success) {
                return new ResponseEntity({ errors: [
                    ...blocksWithTrsResponse.errors,
                    'getMany',
                ] });
            }

            return new ResponseEntity({ data: blocksWithTrsResponse.data });
        } catch (error) {
            return new ResponseEntity({
                errors: [`Unable to load blocks from database. Error: ${error}`],
            });
        }
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
                    `Unable to save blocks with ids ${blocks.map(b => b.id).join(', ')} to database. Error: ${error}`,
                ],
            });
        }

        return new ResponseEntity();
    }

    async batchSave(block: Block): Promise<ResponseEntity<void>> {
        if (block.transactionCount === 0) {
            return this.save(block);
        }

        const serializedBlock = SharedBlockPgRepository.serialize(block);
        try {
            await db.tx(t => {
                const dbQueries = [
                    t.none(pgpE.helpers.insert(serializedBlock, this.columnSet)),
                    t.none(TransactionPGRepo.createInsertQuery(block.transactions)),
                ];

                if (block.transactions.filter(trs => trs.type === TransactionType.SEND).length) {
                    dbQueries.push(t.none(AddressToTransactionPGRepo.createInsertQuery(block.transactions)));
                }

                return t.batch(dbQueries);
            });
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
