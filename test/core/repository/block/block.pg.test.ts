import db from 'shared/driver/db/index';
import { Block } from 'shared/model/block';
import BlockPGRepo from 'core/repository/block/pg';
import config from 'shared/config';
import { expect } from 'chai';
import {
    getNewBlock, createBlockTable, createTrsTable, dropBlockTable, dropTrsTable,
    clearSequence
} from 'test/core/repository/block/mock';

const insertGenesisBlock = async () => {
    await db.query(`INSERT INTO block(id, version, created_at, height,
    transaction_count, amount, fee, payload_hash, generator_public_key, signature)
        VALUES ('firstId', 1, 100, 1, 0, 0, 0, 'hash', 'publicKey', 'signature');`);
};

const insertBlock = async () => {
    let block = getNewBlock();
    await db.query(`INSERT INTO block(id, version, created_at, height,
    transaction_count, amount, fee, payload_hash, generator_public_key, signature)
        VALUES ($1, 1, 100, $2, 0, 0, 0, 'hash', 'publicKey', 'signature');`, [block.id, block.height]);
    return block;
};

const prepareTables = async () => {
    await createBlockTable();
    await createTrsTable();
};

const dropTables = async () => {
    await dropTrsTable();
    await dropBlockTable();
};

describe('Block repository', () => {

    describe('getGenesisBlock', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.getGenesisBlock();
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return response with null', async () => {
                const response = await BlockPGRepo.getGenesisBlock();
                expect(response).to.be.null;
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if block exists', () => {
            before(async () => {
                await prepareTables();
                await insertGenesisBlock();
            });

            it('should return response with genesis block data (blockId = 1)', async () => {
                const response = await BlockPGRepo.getGenesisBlock();
                expect(response).to.be.an.instanceOf(Block);
                expect(response.height).to.be.equal(1);
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('deleteById', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.deleteById('');
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return response with empty array', async () => {
                const response = await BlockPGRepo.deleteById('');
                expect(response).to.be.lengthOf(0);
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if deleting block exists', () => {
            let newBlock;
            before(async () => {
                await prepareTables();
                newBlock = await insertBlock();
            });

            it('should return response with block id', async () => {
                const response = await BlockPGRepo.deleteById(newBlock.id);
                expect(response).to.be.lengthOf(1);
                expect(response[0]).to.be.eq(newBlock.id);
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if deleting blocks exist', () => {
            let firstBlock, secondBlock, thirdBlock;
            before(async () => {
                await prepareTables();
                firstBlock = await insertBlock();
                secondBlock = await insertBlock();
                thirdBlock = await insertBlock();
            });

            it('should return response with block id', async () => {
                const response = await BlockPGRepo.deleteById([firstBlock.id, thirdBlock.id]);
                expect(response).to.be.lengthOf(2);
                expect(response[0]).to.be.eq(firstBlock.id);
                expect(response[1]).to.be.eq(thirdBlock.id);
                const existingBlocks = await BlockPGRepo.getMany();
                expect(existingBlocks).to.be.lengthOf(1);
                expect(existingBlocks[0].id).to.be.equal(secondBlock.id);
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('getById', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.getById('');
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return null', async () => {
                const response = await BlockPGRepo.getById('');
                expect(response).to.be.null;
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if requested block exists', () => {
            let firstBlock;
            before(async () => {
                await prepareTables();
                firstBlock = await insertBlock();
            });

            it('should return response with block', async () => {
                const response = await BlockPGRepo.getById(firstBlock.id);
                expect(response).to.be.instanceOf(Block);
                expect(response.id).to.be.equal(firstBlock.id);
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('getLastBlock', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.getLastBlock();
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return null', async () => {
                const response = await BlockPGRepo.getLastBlock();
                expect(response).to.be.null;
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if at least one block exists', () => {
            let firstBlock;
            before(async () => {
                await prepareTables();
                firstBlock = await insertBlock();
            });

            it('should return response with block', async () => {
                const response = await BlockPGRepo.getLastBlock();
                expect(response).to.be.instanceOf(Block);
                expect(response.id).to.be.equal(firstBlock.id);
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('getLastNBlockIds', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.getLastNBlockIds();
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return null', async () => {
                const response = await BlockPGRepo.getLastNBlockIds();
                expect(response).to.be.null;
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if at least one block exists', () => {
            let blocks = [];
            const n = config.CONSTANTS.BLOCK_SLOT_WINDOW;
            const ids = [];
            before(async () => {
                await prepareTables();
                for (let i = 0; i < (n + 2); i++) {
                    const block = await insertBlock();
                    blocks.push(block);
                    ids.unshift(block.id);
                }
                ids.pop();
                ids.pop();
            });

            it('should return response with array of blocks ids', async () => {
                const response = await BlockPGRepo.getLastNBlockIds();
                expect(response).to.be.an('array');
                expect(response).to.be.eql(ids);
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('getMany', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.getMany();
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return null', async () => {
                const response = await BlockPGRepo.getMany();
                expect(response).to.be.null;
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if at least one block exists', () => {
            let blocks = [];
            const count = 99;
            before(async () => {
                await prepareTables();
                clearSequence();
                for (let i = 0; i < count; i++) {
                    const block = await insertBlock();
                    blocks.push(block);
                }
            });

            it('should return response with array of blocks', async () => {
                let response = await BlockPGRepo.getMany();
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(99);
                response = await BlockPGRepo.getMany(100, 38);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(61);
                expect(response[0].id).to.be.equal(blocks[38].id);
                response = await BlockPGRepo.getMany(26, 8);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(26);
                expect(response[0].id).to.be.equal(blocks[8].id);
                expect(response[25].id).to.be.equal(blocks[33].id);
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('isExist', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.isExist('');
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await prepareTables();
            });

            it('should return null', async () => {
                const response = await BlockPGRepo.isExist('');
                expect(response).to.be.false;
            });

            after(async () => {
                await dropTables();
            });
        });

        context('if block exists', () => {
            let block;
            before(async () => {
                await prepareTables();
                block = await insertBlock();
            });

            it('should return response with boolean value', async () => {
                let response = await BlockPGRepo.isExist('132');
                expect(response).to.be.false;
                response = await BlockPGRepo.isExist(block.id);
                expect(response).to.be.true;
            });

            after(async () => {
                await dropTables();
            });
        });
    });

    describe('saveOrUpdate', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await BlockPGRepo.saveOrUpdate(getNewBlock());
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present', () => {
            let blocks = [];
            const count = 99;
            before(async () => {
                await prepareTables();
                clearSequence();
                for (let i = 0; i < count; i++) {
                    blocks.push(getNewBlock());
                }
            });

            it('should save block', async () => {
                await BlockPGRepo.saveOrUpdate(blocks[0]);
                let response = await BlockPGRepo.getMany();
                expect(response).to.be.lengthOf(1);
                expect(response[0].id).to.be.equal(blocks[0].id);
                await BlockPGRepo.saveOrUpdate(blocks);
                response = await BlockPGRepo.getMany();
                expect(response).to.be.lengthOf(99);
                expect(response[98].id).to.be.equal(blocks[98].id);
            });

            after(async () => {
                await dropTables();
            });
        });
    });
});
