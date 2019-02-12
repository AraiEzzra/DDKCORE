const Inserts = require('../../backlog/helpers/inserts.js');

import { Block } from 'shared/model/block';
import { getAddressByPublicKey } from 'shared/util/account';
import db from 'shared/driver/db';
import Response from 'shared/model/response';
import config from 'shared/util/config';

interface IDBBlockSave {
    table: string;
    fields: string[];
    values: object;
}

export class BlockRepo {
    private dbTable: string = 'blocks';
    private dbFields: string[] = [
        'id',
        'version',
        'timestamp',
        'height',
        'previousBlock',
        'numberOfTransactions',
        'totalAmount',
        'totalFee',
        'reward',
        'payloadLength',
        'payloadHash',
        'generatorPublicKey',
        'blockSignature'
    ];

    constructor() {}

    public async getGenesisBlock(): Promise<Response<Block>> {
        let block: Block = null;
        try {
            const result: object = await db.oneOrNone('SELECT * FROM blocks WHERE "height" = 1');
            if (!result) {
                return new Response({ errors: ['No genesis block found']});
            }
            block = this.dbRead(result);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: block });
    }

    public async isBlockExists(id: string): Promise<Response<boolean>> {
        let exists = null;
        try {
            exists = await db.query('SELECT EXISTS(SELECT * FROM blocks WHERE "id" = ${id})', { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: exists === 't' });
    }

    // if I need to return deleted block?
    public async deleteBlock(blockId: string): Promise<Response<void>> {
        try {
            await db.query('DELETE FROM blocks WHERE "id" = ${blockId};', { blockId });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response();
    }

    public async getIdSequence(param: { height: number, delegates: number, limit: number}): Promise<Response<string[]>> {
        const request =
            `WITH 
            current_round AS (SELECT CEIL(b.height / ${param.delegates}::float)::bigint as height FROM blocks b WHERE b.height <= ${param.height} ORDER BY b.height DESC LIMIT 1)
            rounds AS (SELECT * FROM generate_series((SELECT * FROM current_round), (SELECT * FROM current_round) - ${param.limit} + 1, -1))'
            SELECT
            b.id, b.height, CEIL(b.height / ${param.delegates}::float)::bigint AS round
            FROM blocks b
            WHERE b.height IN (SELECT ((n - 1) * ${param.delegates}) + 1 FROM rounds AS s(n)) ORDER BY height DESC`;
        let result = [];
        try {
            result = await db.query(request);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        const ids: string[] = [];
        result.forEach((row) => {
            ids.push(row.id);
        });
        return new Response({ data: ids });
    }

    public async getCommonBlock(param: {id: string, previousBlock: Block, height: number}): Promise<Response<string>> {
        const request =  [
            'SELECT COUNT("id")::int FROM blocks WHERE "id" = ${id}',
            (param.previousBlock ? 'AND "previousBlock" = ${previousBlock}' : ''),
            'AND "height" = ${height}'
        ].filter(Boolean).join(' ');
        let result;
        try {
            result = await db.query(request, param);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: result });
    }

    public async loadBlocksOffset(param: {offset: number, limit: number}): Promise<Response<Block[]>> {
        let blocks: Block[] = null;
        try {
            const result: object[] = await db.manyOrNone('SELECT * FROM full_blocks_list WHERE "b_height" >= ${offset} AND "b_height" < ${limit} ORDER BY "b_height", t_type, t_timestamp, "t_id"', { offset: param.offset, limit: param.limit });
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            result.forEach((row) => {
                blocks.push(this.dbRead(row));
            });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: blocks });
    }

    public async loadLastBlock(): Promise<Response<Block>> {
        let block: Block = null;
        try {
            const result: object = await db.oneOrNone('SELECT * FROM full_blocks_list WHERE "b_height" = (SELECT MAX("height") FROM blocks) ORDER BY "b_height", t_type, t_timestamp, "t_id"');
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            block = this.dbRead(result);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: block });
    }

    public async loadLastNBlocks(): Promise<Response<string[]>> {
        let ids: string[] = null;
        try {
            const result: object[] = await db.manyOrNone('SELECT id FROM blocks ORDER BY id DESC LIMIT ${blockLimit}', { blockLimit: config.constants.blockSlotWindow });
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            result.forEach((row) => {
                ids.push(this.dbRead(row).id);
            });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: ids });
    }

    public async deleteAfterBlock(id: string): Promise<Response<void>> {
        try {
            await db.query('DELETE FROM blocks WHERE "height" >= (SELECT "height" FROM blocks WHERE "id" = ${id});', { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response();
    }

    public dbSave(block: Block): IDBBlockSave {
        let payloadHash,
            generatorPublicKey,
            blockSignature;

        try {
            payloadHash = Buffer.from(block.payloadHash, 'hex');
            generatorPublicKey = Buffer.from(block.generatorPublicKey, 'hex');
            blockSignature = Buffer.from(block.blockSignature, 'hex');
        } catch (e) {
            throw e;
        }

        return {
            table: this.dbTable,
            fields: this.dbFields,
            values: {
                id: block.id,
                version: block.version,
                timestamp: block.timestamp,
                height: block.height,
                previousBlock: block.previousBlock || null,
                numberOfTransactions: block.numberOfTransactions,
                totalAmount: block.totalAmount,
                totalFee: block.totalFee,
                reward: block.reward || 0,
                payloadLength: block.payloadLength,
                payloadHash,
                generatorPublicKey,
                blockSignature
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
            rawBlock = await db.query('SELECT * FROM full_blocks_list where b_id=${id} ORDER BY "b_height", t_type, t_timestamp, "t_id"', { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        //todo: map fields if view is in use
        return new Response({ data: this.dbRead({
                id: rawBlock.b_id,
            })
        });
    }

    public dbRead(raw: {[key: string]: any}, radix: number = 10): Block {
        if (!raw.id) {
            return null;
        }

        const block: Block = new Block({
            id: raw.id,
            rowId: parseInt(raw.rowId, radix),
            version: parseInt(raw.version, radix),
            timestamp: parseInt(raw.timestamp, radix),
            height: parseInt(raw.height, radix),
            previousBlock: raw.previousBlock,
            numberOfTransactions: parseInt(raw.numberOfTransactions, radix),
            totalAmount: BigInt(raw.totalAmount),
            totalFee: BigInt(raw.totalFee),
            reward: parseInt(raw.reward, radix),
            payloadLength: parseInt(raw.payloadLength, radix),
            payloadHash: raw.payloadHash,
            generatorPublicKey: raw.generatorPublicKey,
            generatorId: getAddressByPublicKey(raw.generatorPublicKey),
            blockSignature: raw.blockSignature
        });

        block.totalForged = BigInt(block.totalFee) + BigInt(block.reward);
        return block;
    }
}
