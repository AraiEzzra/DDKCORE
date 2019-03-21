import { Block } from 'shared/model/block';
import db from 'shared/driver/db';
import * as crypto from 'crypto';

let blockIdSequence = 1;
export const clearSequence = () => blockIdSequence = 1;
export const getNewBlock = (): Block => {
    return new Block({
        id: crypto.createHash('sha256').update(Buffer.from('' + blockIdSequence)).digest('hex'),
        height: blockIdSequence++,
        previousBlockId: null,
        createdAt: Math.floor(Date.now() / 1000),
        transactions: []
    });
};

export const createTrsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS "trs" (
            "id"                CHAR(64)  NOT NULL PRIMARY KEY,
            "block_id"          CHAR(64)  NOT NULL REFERENCES block ON DELETE CASCADE,
            "type"              SMALLINT  NOT NULL,
            "created_at"        INTEGER   NOT NULL,
            "sender_public_key" CHAR(64)  NOT NULL,
            "signature"         CHAR(128) NOT NULL,
            "second_signature"  CHAR(128),
            "salt"              CHAR(32)  NOT NULL DEFAULT '' :: BPCHAR,
            "asset"             JSON      NOT NULL DEFAULT '{}' :: JSON
        );
    `);
};

export const createBlockTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS "block" (
             "id"                   CHAR(64) PRIMARY KEY,
             "version"              INT    NOT NULL,
             "created_at"           INT    NOT NULL,      
             "height"               INT    NOT NULL,
             "previous_block_id"    CHAR(64) REFERENCES block ON DELETE SET NULL,
             "transaction_count"    INT    NOT NULL,
             "amount"               BIGINT NOT NULL,
             "fee"                  BIGINT NOT NULL,
             "payload_hash"         CHAR(64) NOT NULL,
             "generator_public_key" CHAR(64)  NOT NULL,
             "signature"            CHAR(128)  NOT NULL
        );
    `);
};

export const dropBlockTable = async () => {
    await db.query('DROP TABLE block;');
};

export const dropTrsTable = async () => {
    await db.query('DROP TABLE trs;');
};
