import {Transaction} from 'shared/model/transaction';
import TransactionRepo from 'core/repository/transaction';
const Inserts = require('../../backlog/helpers/inserts.js');
import { Block } from 'shared/model/block';
import db from 'shared/driver/db';
import Response from 'shared/model/response';
import config from 'shared/util/config';
import queries from 'core/repository/queries/block';

interface IDBBlockSave {
    table: string;
    fields: Array<string>;
    values: object;
}

class BlockRepo {
    private dbTable: string = 'blocks';
    private dbFields: Array<string> = [
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

    public async getGenesisBlock(): Promise<Response<Block>> {
        let block: Block = null;
        try {
            const result: object = await db.oneOrNone(queries.getGenesisBlock);
            if (!result) {
                return new Response({ errors: ['No genesis block found']});
            }
            block = await this.dbRead(result);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        block = await this.assignTransactions([block])[0];
        return new Response({ data: block });
    }

    public async isBlockExists(id: string): Promise<Response<boolean>> {
        let exists = null;
        try {
            exists = await db.one(queries.isBlockExists, { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: exists === 't' });
    }

    // if I need to return deleted block?
    public async deleteBlock(blockId: string): Promise<Response<void>> {
        try {
            await db.none(queries.deleteBlock, { blockId });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response();
    }

    // todo: should be redone
    public async getIdSequence(
        param: { height: number, delegates: number, limit: number}
        ): Promise<Response<Array<string>>> {
        let result = [];
        try {
            result = await db.query(queries.getIdSequence(param));
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        const ids: Array<string> = [];
        result.forEach((row) => {
            ids.push(row.id);
        });
        return new Response({ data: ids });
    }

    public async getCommonBlock(param: {id: string, previousBlock: Block, height: number}): Promise<Response<string>> {
        let result;
        try {
            result = await db.oneOrNone(queries.getCommonBlock(param.previousBlock), {
                id: param.id,
                previousBlockId: param.previousBlock.id,
                height: param.height
            });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: result });
    }

    public async loadBlocksOffset(param: {offset: number, limit?: number}): Promise<Response<Array<Block>>> {
        let blocks: Array<Block> = null;
        try {
            const result: Array<object> = await db.manyOrNone(queries.loadBlocksOffset(param.limit), param);
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            result.forEach(async (row) => {
                blocks.push(await this.dbRead(row));
            });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        blocks = await this.assignTransactions(blocks);
        return new Response({ data: blocks });
    }

    public async loadLastBlock(): Promise<Response<Block>> {
        let block: Block = null;
        try {
            const result: object = await db.oneOrNone(queries.loadLastBlock);
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            block = await this.dbRead(result);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        block = await this.assignTransactions([block])[0];
        return new Response({ data: block });
    }

    public async loadLastNBlocks(): Promise<Response<Array<string>>> {
        let ids: Array<string> = null;
        try {
            const result: Array<{id: string}> = await db.manyOrNone(queries.loadLastNBlocks,
                { blockLimit: config.constants.blockSlotWindow });
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            result.forEach((row) => {
                ids.push(row.id);
            });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: ids });
    }

    public async deleteAfterBlock(id: string): Promise<Response<void>> {
        try {
            await db.query(queries.deleteAfterBlock, { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response();
    }

    public dbSave(block: Block): IDBBlockSave {
        return {
            table: this.dbTable,
            fields: this.dbFields,
            values: {
                id: block.id,
                version: block.version,
                created_at: block.createdAt,
                height: block.height,
                previous_block_id: block.previousBlockId || null,
                transaction_count: block.transactionCount,
                amount: block.amount,
                fee: block.fee,
                payload_hash: block.payloadHash,
                generator_public_key: block.generatorPublicKey,
                signature: block.signature
            }
        };
    }

    public async saveBlock(block: Block): Promise<Response<void>> {
        try {
            await db.tx(async (t) => {
                const promise: IDBBlockSave = this.dbSave(block);
                const inserts = new Inserts(promise, promise.values);

                const promises = [t.none(inserts.template(), promise.values)];
                // Exec inserts as batch
                await t.batch(promises);
            });
        } catch (e) {

        }

        return undefined;
    }

    public async loadFullBlockById(id: string): Promise<Response<Block>> {
        let rawBlock = null;
        try {
            rawBlock = await db.oneOrNone(queries.loadFullBlockById, { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        let block: Block = await this.dbRead(rawBlock);
        block = await this.assignTransactions([block])[0];
        return new Response({ data: block });
    }

    public async dbRead(raw: {[key: string]: any}, radix: number = 10): Promise<Block> {
        if (!raw.id) {
            return null;
        }

        const block: Block = new Block({
            id: raw.id,
            version: parseInt(raw.version, radix),
            createdAt: parseInt(raw.created_at, radix),
            height: parseInt(raw.height, radix),
            previousBlockId: raw.previous_block_id,
            transactionCount: parseInt(raw.transaction_count, radix),
            amount: raw.amount,
            fee: raw.fee,
            payloadHash: raw.payload_hash,
            generatorPublicKey: raw.generator_public_key,
            signature: raw.signature
        });

        return block;
    }

    private async assignTransactions(blocks: Array<Block>): Promise<Array<Block>> {
        const ids: Array<string> = blocks.map((block: Block) => {
            return block.id;
        });
        const transactionsResponse: Response<{ [blockId: string]:  Array<Transaction<object>> }> =
            await TransactionRepo.getTransactionsForBlocksByIds(ids);
        if (!transactionsResponse.success) {
            return blocks;
        }
        const transactions: { [blockId: string]:  Array<Transaction<object>> } = transactionsResponse.data;
        blocks.forEach((block: Block) => {
            if (transactions[block.id]) {
                block.transactions = transactions[block.id];
            }
        });
        return blocks;
    }
}

export default new BlockRepo();
