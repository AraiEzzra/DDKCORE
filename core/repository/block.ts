const bignum = require('../helpers/bignum.js');
const Inserts = require('../../backlog/helpers/inserts.js');

import { Block } from 'shared/model/block';
import db from 'shared/driver/db';
import { getAddressByPublicKey } from 'shared/util/account';
import Response from 'shared/model/response';

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
            const result = db.oneOrNone('SELECT * FROM blocks WHERE "height" = 1');
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

    public async countList(where, params): Promise<Response<number>> { return undefined; }

    public async list(filter, params): Promise<Response<Block[]>> { return undefined; }

    // if I need to return deleted block?
    public async deleteBlock(blockId: string): Promise<Response<void>> { return undefined; }

    public async getIdSequence(param: { height: number, delegetes: [], limit: number}): Promise<Response<string>> { return undefined; }

    public async getCommonBlock(param: {id: string, previousBlock: Block, height: number}): Promise<Response<Block>> { return undefined; }

    public async loadBlocksOffset(param: {}): Promise<Response<Block[]>> { return undefined; }

    public async loadLastBlock(): Promise<Response<Block>> { return undefined; }

    public async loadBlockByHeight(height: number): Promise<Response<Block>> { return undefined; }

    public async aggregateBlocksReward(filter: object): Promise<Response<{ fees: number, rewards: number, count: number}>> { return undefined; }

    public async loadLastNBlocks(): Promise<Response<string[]>> {
        // return array of ids
        return undefined;
    }

    public async deleteAfterBlock(id: string): Promise<Response<void>> { return undefined; }

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
            library.logger.error(`[Chain][saveBlock][tx]: ${e}`);
            library.logger.error(`[Chain][saveBlock][tx][stack]: \n ${e.stack}`);
        }

        return undefined;
    }

    public async loadFullBlockById(id: string): Promise<Response<Block>> {
        const rawBlock = await db.query('SELECT * FROM full_blocks_list where b_id=${id} ORDER BY "b_height", t_type, t_timestamp, "t_id"', { id });
        return new Response({ data: this.dbRead(rawBlock) });
    }

    private dbRead(raw: {[key: string]: any}, radix: number = 10): Block {
        if (!raw.b_id) {
            return null;
        }
        const block: Block = {
            id: raw.b_id,
            rowId: parseInt(raw.b_rowId, radix),
            version: parseInt(raw.b_version, radix),
            timestamp: parseInt(raw.b_timestamp, radix),
            height: parseInt(raw.b_height, radix),
            previousBlock: raw.b_previousBlock,
            numberOfTransactions: parseInt(raw.b_numberOfTransactions, radix),
            totalAmount: parseInt(raw.b_totalAmount, radix),
            totalFee: parseInt(raw.b_totalFee, radix),
            reward: parseInt(raw.b_reward, radix),
            payloadLength: parseInt(raw.b_payloadLength, radix),
            payloadHash: raw.b_payloadHash,
            generatorPublicKey: raw.b_generatorPublicKey,
            generatorId: getAddressByPublicKey(raw.b_generatorPublicKey),
            blockSignature: raw.b_blockSignature,
            confirmations: parseInt(raw.b_confirmations, radix),
            username: raw.m_username
        };
        block.totalForged = new bignum(block.totalFee).plus(new bignum(block.reward)).toString();
        return block;
    }
}
