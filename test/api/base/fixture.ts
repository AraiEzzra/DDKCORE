import { MessageType } from 'shared/model/message';
import { db } from 'shared/driver';
import { getTime, randNumber, randStr } from 'test/api/base/util';
import { createBlockQuery, createTransactionQuery } from 'test/api/base/query';

export const GENESIS_BLOCK_ID = 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0';
export const BASE_ACCOUNT = {
    secret: 'ghost success egg feature conduct spell surface love casino sample truly grace',
    secondSecret: 'skin rural air lens frequent you foster hobby ethics confirm wing place',
    address: '17632801559928373567',
    publicKey: 'c6fd098455ec6661000174467895f244b078c13cd8f646af0a668e45b662bbb2'
};

export class Fixture {

    static getBaseHeaders() {
        const id = Math.ceil(Math.random() * 100000).toString();
        return {
            id,
            type: MessageType.REQUEST
        };
    }

    static async createBlock() {
        const rawBlock: any = await db.one(createBlockQuery, {
            id: randStr(64),
            version: 0,
            created_at: getTime(),
            height: randNumber(2, 1000),
            previous_block_id: GENESIS_BLOCK_ID,
            transaction_count: 0,
            amount: 0,
            fee: 0,
            payload_hash: randStr(64),
            generator_public_key: BASE_ACCOUNT.publicKey,
            signature: randStr(64)
        });

        return {
            id: rawBlock.id,
        };
    }

    static async createTransaction(type, blockId, asset) {
        const rawTrs: any = await db.one(createTransactionQuery, {
            id: randStr(64),
            block_id: blockId,
            type,
            created_at: getTime(),
            sender_public_key: BASE_ACCOUNT.publicKey,
            signature: randStr(64),
            second_signature: randStr(64),
            fee: 0,
            salt: randStr(32),
            asset
        });
        return {
            id: rawTrs.id,
            createdAt: rawTrs.created_at
        };
    }

    static async removeTransaction(id: string) {
        await db.none('DELETE FROM trs where id=${id}', { id });
    }

    static async removeBlock(id: string) {
        await db.none('DELETE FROM block where id=${id}', { id });
    }
}
