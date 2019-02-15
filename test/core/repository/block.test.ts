/* tslint-disable no-unused-expressions */

process.env.DB_HOST = '127.0.0.1';
process.env.DB_NAME = 'ddk';
process.env.DB_USER = 'lisk';
process.env.DB_PASSWORD = 'password';

import db from 'shared/driver/db';
import { Block } from 'shared/model/block';
import BlockRepo from 'core/repository/block';
import { expect } from 'chai';
import Response from 'shared/model/response';

const createTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS "blocks" (
             "id"                   CHAR(64) PRIMARY KEY,
             "rowId"                SERIAL NOT NULL,
             "version"              INT    NOT NULL,
             "timestamp"            INT    NOT NULL,
             "height"               INT    NOT NULL,
             "previousBlock"        CHAR(64),
             "numberOfTransactions" INT    NOT NULL,
             "totalAmount"          BIGINT NOT NULL,
             "totalFee"             BIGINT NOT NULL,
             "reward"               BIGINT NOT NULL,
             "payloadLength"        INT    NOT NULL,
             "payloadHash"          BYTEA  NOT NULL,
             "generatorPublicKey"   CHAR(64)  NOT NULL,
             "blockSignature"       BYTEA  NOT NULL,
             FOREIGN KEY ("previousBlock")
             REFERENCES "blocks" ("id") ON DELETE SET NULL
        );       
    `);
};

const dropTable = async () => {
    await db.query('DROP TABLE blocks;');
};

const insertGenesisBlock = async () => {
    const hash = new Buffer('hash');
    const signature = new Buffer('signature');
    await db.query(`INSERT INTO blocks(id, version, timestamp, height, "numberOfTransactions", "totalAmount", "totalFee", reward, "payloadLength", "payloadHash", "generatorPublicKey", "blockSignature") 
        VALUES ('firstId', 1, 100, 1, 0, 0, 0, 0, 0, '${hash}', 'publicKey', '${signature}');`);
};

describe('Block repository', () => {

    describe('getGenesisBlock', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                const response = await BlockRepo.getGenesisBlock();
                expect(response).to.be.instanceOf(Response);
                expect(response.success).to.be.false;
                expect(response.errors.length).to.be.above(0);
                expect(response.data).to.be.null;
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createTable();
            });

            it('should return response with error', async () => {
                const response = await BlockRepo.getGenesisBlock();
                expect(response).to.be.instanceOf(Response);
                expect(response.success).to.be.false;
                expect(response.errors.length).to.be.equal(1);
                expect(response.errors).to.be.eql(['No genesis block found']);
                expect(response.data).to.be.null;
            });

            after(async () => {
                await dropTable();
            });
        });

        context('if block exists', () => {
            before(async () => {
                await createTable();
                await insertGenesisBlock();
            });

            it('should return response with genesis block data (blockId = 1)', async () => {
                const response: Response<Block> = await BlockRepo.getGenesisBlock();
                expect(response).to.be.an.instanceOf(Response);
                expect(response.success).to.be.true;
                expect(response.errors).to.be.null;
                expect(response.data).to.be.an.instanceOf(Block);
                expect(response.data.height).to.be.equal(1);
            });

            after(async () => {
                await dropTable();
            });
        });
    });
});
