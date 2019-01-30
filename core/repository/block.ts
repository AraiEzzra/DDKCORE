const bignum = require('../helpers/bignum.js');
const Inserts = require('../../backlog/helpers/inserts.js');

import { Block } from 'shared/model/block';
import db from 'shared/driver/db';
import { getAddressByPublicKey } from 'shared/util/account';

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

    public getGenesisBlock(): Block {
        return undefined;
    }

    public getBlockId(id: string): string { return undefined; }

    public async isBlockExists(id: string): Promise<boolean> {
        return await db.query('SELECT EXISTS(SELECT * FROM blocks WHERE "id" = ${id})', { id });
    }

    public countList(where, params): number { return undefined; }

    public list(filter, params): Block[] { return undefined; }

    public deleteBlock(blockId: string): void {}

    public getIdSequence(param: { height: number, delegetes: [], limit: number}) {}

    public getCommonBlock(param: {id: string, previousBlock: Block, height: number}): Block { return undefined; }

    public loadBlocksOffset(param: {}): object[] { return undefined; }

    public loadLastBlock(): Block { return undefined; }

    public loadBlockByHeight(height: number): Block { return undefined; }

    public aggregateBlocksReward(filter: object): { fees: number, rewards: number, count: number} { return undefined; }

    public loadLastNBlocks(): string[] {
        // return array of ids
        return undefined;
    }

    public deleteAfterBlock(id: string): void { return undefined; }

    public loadBlocksData() {}

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

    public async saveBlock(block: Block): Promise<void> {
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
    }

    public async loadFullBlockById(id: string): Promise<Block> {
        const rawBlock = await db.query('SELECT * FROM full_blocks_list where b_id=${id} ORDER BY "b_height", t_type, t_timestamp, "t_id"', { id });
        return this.dbRead(rawBlock);
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
