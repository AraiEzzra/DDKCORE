import {Transaction, TransactionType} from 'shared/model/transaction';
import db from 'shared/driver/db';
import * as crypto from 'crypto';

let transactionIdSequence = 1;
export const getNewTransaction = () => {
    transactionIdSequence++;
    return new Transaction({
        type: TransactionType.SEND,
        id: crypto.createHash('sha256').update(Buffer.from('id' + transactionIdSequence)).digest('hex'),
        senderPublicKey: crypto.createHash('sha256').update(Buffer.from('user' + transactionIdSequence)).digest('hex'),
        createdAt: Math.floor(Date.now() / 1000),
        asset: {
            recipientAddress: 1n,
            amount: 10
        },
        signature: 'signature',
        salt: 'salt'
    });
};

export const blockId2 = crypto.createHash('sha256').update(Buffer.from('2')).digest('hex');
export const blockId4 = crypto.createHash('sha256').update(Buffer.from('4')).digest('hex');
export const blockId6 = crypto.createHash('sha256').update(Buffer.from('6')).digest('hex');

export const getNewTransactionWithBlockId = (blockId) => {
    const trs = getNewTransaction();
    trs.blockId = blockId;
    return trs;
};

export const getNewTransactionWithRandomBlockId = () => {
    const trs = getNewTransaction();
    trs.blockId = [blockId2, blockId4, blockId6][Math.floor(Math.random() * Math.floor(3))];
    return trs;
};

export const createTrsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS "trs" (
            "id"                CHAR(64)  NOT NULL PRIMARY KEY,
            "block_id"          CHAR(64)  NOT NULL,
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

export const dropTrsTable = async () => {
    await db.query('DROP TABLE trs;');
};
