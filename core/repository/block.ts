const Inserts = require('../../backlog/helpers/inserts.js');
import { Block } from 'shared/model/block';
import db from 'shared/driver/db';
import Response from 'shared/model/response';
import config from 'shared/util/config';

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
            exists = await db.one('SELECT EXISTS(SELECT * FROM blocks WHERE "id" = ${id})', { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: exists === 't' });
    }

    // if I need to return deleted block?
    public async deleteBlock(blockId: string): Promise<Response<void>> {
        try {
            await db.none('DELETE FROM blocks WHERE "id" = ${blockId};', { blockId });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response();
    }

    // todo: should be redone
    public async getIdSequence(
        param: { height: number, delegates: number, limit: number}
        ): Promise<Response<Array<string>>> {
        const request =
            `WITH 
            current_round AS (
                SELECT CEIL(b.height / ${param.delegates}::float)::bigint as height 
                FROM blocks b 
                WHERE b.height <= ${param.height} 
                ORDER BY b.height DESC LIMIT 1)
            rounds AS (
                SELECT * 
                FROM generate_series(
                    (SELECT * FROM current_round),
                    (SELECT * FROM current_round) - ${param.limit} + 1, 
                    -1
                )
            )
            SELECT
            b.id, b.height, CEIL(b.height / ${param.delegates}::float)::bigint AS round
            FROM blocks b
            WHERE b.height IN (
                SELECT ((n - 1) * ${param.delegates}) + 1 FROM rounds AS s(n)
            ) 
            ORDER BY height DESC`;
        let result = [];
        try {
            result = await db.query(request);
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
        const request =  [
            'SELECT COUNT("id")::int FROM blocks WHERE "id" = ${id}',
            (param.previousBlock ? 'AND "previous_block_id" = ${previousBlockId}' : ''),
            'AND "height" = ${height}'
        ].filter(Boolean).join(' ');
        let result;
        try {
            result = await db.oneOrNone(request, {
                id: param.id,
                previousBlockId: param.previousBlock.id,
                height: param.height
            });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: result });
    }

    public async loadBlocksOffset(param: {offset: number, limit: number}): Promise<Response<Array<Block>>> {
        let blocks: Array<Block> = null;
        try {
            const result: Array<object> = await db.manyOrNone(
                'SELECT * ' +
                'FROM blocks ' +
                'WHERE "height" >= ${offset} AND "height" < ${limit} ' +
                'ORDER BY "height"',
                param);
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
            const result: object = await db.oneOrNone(
                'SELECT * ' +
                'FROM blocks' +
                'WHERE "height" = (' +
                '   SELECT MAX("height") ' +
                '   FROM blocks' +
                ') ' +
                'ORDER BY "height"');
            if (!result) {
                return new Response({ errors: ['No blocks found']});
            }
            block = this.dbRead(result);
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: block });
    }

    public async loadLastNBlocks(): Promise<Response<Array<string>>> {
        let ids: Array<string> = null;
        try {
            const result: Array<{id: string}> = await db.manyOrNone(
                'SELECT id ' +
                'FROM blocks ' +
                'ORDER BY height DESC ' +
                'LIMIT ${blockLimit}',
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
            await db.query(
                'DELETE ' +
                'FROM blocks ' +
                'WHERE "height" >= (' +
                '   SELECT "height" ' +
                '   FROM blocks ' +
                '   WHERE "id" = ${id}' +
                ');',
                { id });
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
            rawBlock = await db.oneOrNone(
                'SELECT * ' +
                'FROM blocks ' +
                'WHERE id = ${id} ' +
                'ORDER BY "height"',
                { id });
        } catch (pgError) {
            return new Response({ errors: [pgError]});
        }
        return new Response({ data: this.dbRead(rawBlock) });
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
}

export default new BlockRepo();
