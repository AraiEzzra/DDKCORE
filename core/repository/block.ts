import {Transaction} from 'shared/model/transaction';
import TransactionRepo from 'core/repository/transaction';
const Inserts = require('../../backlog/helpers/inserts.js');
import { Block } from 'shared/model/block';
// import db from 'shared/driver/db';
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

    private memoryBlocks: Array<Block> = [];

    public async getGenesisBlock(): Promise<Response<Block>> {
        // let block: Block = null;
        // try {
        //     const result: object = await db.oneOrNone(queries.getGenesisBlock);
        //     if (!result) {
        //         return new Response({ errors: ['No genesis block found']});
        //     }
        //     block = await this.dbRead(result);
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        // const assignResponse: Response<Array<Block>> = await this.assignTransactions([block]);
        // if (!assignResponse.success) {
        //     return new Response({ errors: [...assignResponse.errors, 'getGenesisBlock'], data: block });
        // }
        // block = assignResponse.data[0];
        return new Response({ data: this.memoryBlocks[0].getCopy() });
    }

    public async isBlockExists(id: string): Promise<Response<boolean>> {
        // let exists = null;
        // try {
        //     exists = await db.one(queries.isBlockExists, { id });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        // return new Response({ data: exists === 't' });
        let exists = false;
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === id) {
                exists = true;
                break;
            }
        }
        return new Response({ data: exists });
    }

    // if I need to return deleted block?
    public async deleteBlock(blockId: string): Promise<Response<void>> {
        // try {
        //     await db.none(queries.deleteBlock, { blockId });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === blockId) {
                delete (this.memoryBlocks[i]);
                break;
            }
        }
        return new Response();
    }

    // todo: should be redone
    public async getIdSequence(
        param: { height: number, delegates: number, limit: number}
        ): Promise<Response<Array<string>>> {
        // let result = [];
        // try {
        //     result = await db.query(queries.getIdSequence(param));
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        // const ids: Array<string> = [];
        // result.forEach((row) => {
        //     ids.push(row.id);
        // });
        const targetBlocks: Array<Block> = this.memoryBlocks.slice(-param.limit);
        const ids: Array<string> = targetBlocks.map((block: Block) => {
            return block.id;
        });
        return new Response({ data: ids });
    }

    public async getCommonBlock(param: {id: string, previousBlock: Block, height: number}): Promise<Response<boolean>> {
        // let result;
        // try {
        //     result = await db.oneOrNone(queries.getCommonBlock(param.previousBlock), {
        //         id: param.id,
        //         previousBlockId: param.previousBlock.id,
        //         height: param.height
        //     });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        let exists = false;
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === param.id &&
                this.memoryBlocks[i].previousBlockId === param.previousBlock.id) {
                exists = true;
                break;
            }
        }
        return new Response({ data: exists });
    }

    public async loadBlocksOffset(param: {offset: number, limit?: number}): Promise<Response<Array<Block>>> {
        // let blocks: Array<Block> = null;
        // try {
        //     const result: Array<object> = await db.manyOrNone(queries.loadBlocksOffset(param.limit), param);
        //     if (!result) {
        //         return new Response({ errors: ['No blocks found']});
        //     }
        //     result.forEach((row) => {
        //         blocks.push(this.dbRead(row));
        //     });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        // const assignResponse: Response<Array<Block>> = await this.assignTransactions(blocks);
        // if (!assignResponse.success) {
        //     return new Response({ errors: [...assignResponse.errors, 'loadBlocksOffset'], data: blocks });
        // }
        // blocks = assignResponse.data;
        const rquestLimit = param.limit || -1;
        const targetBlocks: Array<Block> = this.memoryBlocks.slice(param.offset - 1, rquestLimit);
        return new Response({ data: targetBlocks });
    }

    public async loadLastBlock(): Promise<Response<Block>> {
        // let block: Block = null;
        // try {
        //     const result: object = await db.oneOrNone(queries.loadLastBlock);
        //     if (!result) {
        //         return new Response({ errors: ['No blocks found']});
        //     }
        //     block = await this.dbRead(result);
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        // const assignResponse: Response<Array<Block>> = await this.assignTransactions([block]);
        // if (!assignResponse.success) {
        //     return new Response({ errors: [...assignResponse.errors, 'loadLastBlock'], data: block });
        // }
        // block = assignResponse.data[0];
        return new Response({ data: this.memoryBlocks[this.memoryBlocks.length - 1].getCopy() });
    }

    public async loadLastNBlocks(): Promise<Response<Array<string>>> {
        // let ids: Array<string> = null;
        // try {
        //     const result: Array<{id: string}> = await db.manyOrNone(queries.loadLastNBlocks,
        //         { blockLimit: config.constants.blockSlotWindow });
        //     if (!result) {
        //         return new Response({ errors: ['No blocks found']});
        //     }
        //     result.forEach((row) => {
        //         ids.push(row.id);
        //     });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        const targetBlocks: Array<Block> = this.memoryBlocks.slice(-config.constants.blockSlotWindow);
        const ids: Array<string> = targetBlocks.map((block: Block) => {
            return block.id;
        });
        return new Response({ data: ids });
    }

    public async deleteAfterBlock(id: string): Promise<Response<void>> {
        // try {
        //     await db.query(queries.deleteAfterBlock, { id });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        let index = null;
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === id ) {
                index = i;
                break;
            }
        }
        this.memoryBlocks = this.memoryBlocks.slice(0, index + 1);
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
        // try {
        //     await db.tx(async (t) => {
        //         const promise: IDBBlockSave = this.dbSave(block);
        //         const inserts = new Inserts(promise, promise.values);
        //
        //         const promises = [t.none(inserts.template(), promise.values)];
        //         // Exec inserts as batch
        //         await t.batch(promises);
        //     });
        // } catch (e) {
        //
        // }
        this.memoryBlocks.push(block);
        return new Response();
    }

    public async loadFullBlockById(id: string): Promise<Response<Block>> {
        // let rawBlock = null;
        // try {
        //     rawBlock = await db.oneOrNone(queries.loadFullBlockById, { id });
        // } catch (pgError) {
        //     return new Response({ errors: [pgError]});
        // }
        // let block: Block = await this.dbRead(rawBlock);
        // const assignResponse: Response<Array<Block>> = await this.assignTransactions([block]);
        // if (!assignResponse.success) {
        //     return new Response({ errors: [...assignResponse.errors, 'loadFullBlockById'], data: block });
        // }
        // block = assignResponse.data[0];
        let targetBlock: Block = null;
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            if (this.memoryBlocks[i].id === id ) {
                targetBlock = this.memoryBlocks[i];
                break;
            }
        }
        return new Response({ data: targetBlock });
    }

    public dbRead(raw: {[key: string]: any}, radix: number = 10): Block {
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

    private async assignTransactions(blocks: Array<Block>): Promise<Response<Array<Block>>> {
        let totalTransactionCount = 0;
        const ids: Array<string> = blocks.map((block: Block) => {
            totalTransactionCount += block.transactionCount;
            return block.id;
        });
        if (!totalTransactionCount) {
            return new Response({ data: blocks });
        }
        const transactionsResponse: Response<{ [blockId: string]:  Array<Transaction<object>> }> =
            await TransactionRepo.getTransactionsForBlocksByIds(ids);
        if (!transactionsResponse.success) {
            return new Response({ errors: [...transactionsResponse.errors, 'assignTransaction'] });
        }
        const transactions: { [blockId: string]:  Array<Transaction<object>> } = transactionsResponse.data;
        blocks.forEach((block: Block) => {
            if (transactions[block.id]) {
                block.transactions = transactions[block.id];
            }
        });
        return new Response({ data: blocks });
    }
}

export default new BlockRepo();
