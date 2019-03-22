import { Block } from 'shared/model/block';
import BlockPGRepo from 'core/repository/block/pg';
import config from 'shared/util/config';
import { expect } from 'chai';
import {
    getNewBlock, restartIteration
} from 'test/core/repository/block/mock';
import {pgpE} from 'shared/driver/db';
import db from 'shared/driver/db';

const insertBlock = async () => {
    let block = getNewBlock();
    await BlockPGRepo.saveOrUpdate(block);
    return block;
};

describe('Block repository', () => {

    beforeEach(() => {
        restartIteration();
    });

    describe('getGenesisBlock', () => {
        context('if block exists', () => {
            it('should return response with genesis block data (blockId = 1)', async () => {
                const response = await BlockPGRepo.getGenesisBlock();
                expect(response).to.be.an.instanceOf(Block);
                expect(response.height).to.be.equal(1);
            });
        });
    });

    describe('deleteById', () => {

        context('if deleting block exists', () => {
            let newBlock;
            before(async () => {
                newBlock = await insertBlock();
            });

            it('should return response with block id', async () => {
                const response = await BlockPGRepo.deleteById(newBlock.id);
                expect(response).to.be.lengthOf(1);
                expect(response[0]).to.be.eq(newBlock.id);
            });
        });

        context('if deleting blocks exist', () => {
            let firstBlock, secondBlock, thirdBlock;
            before(async () => {
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
                expect(existingBlocks).to.be.lengthOf(2);
                expect(existingBlocks[1].id).to.be.equal(secondBlock.id);
            });

            after(async () => {
                await BlockPGRepo.deleteById(secondBlock.id);
            });
        });
    });

    describe('getById', () => {

        context('if requested block doesn\'t exist', () => {
            it('should return null', async () => {
                const response = await BlockPGRepo.getById('');
                expect(response).to.be.null;
            });

        });

        context('if requested block exists', () => {
            let firstBlock;
            before(async () => {
                firstBlock = await insertBlock();
            });

            it('should return response with block', async () => {
                const response = await BlockPGRepo.getById(firstBlock.id);
                expect(response).to.be.instanceOf(Block);
                expect(response.id).to.be.equal(firstBlock.id);
            });

            after(async () => {
                await BlockPGRepo.deleteById(firstBlock.id);
            });
        });
    });

    describe('getLastBlock', () => {

        context('if at least one block exists', () => {
            let firstBlock;
            before(async () => {
                firstBlock = await insertBlock();
            });

            it('should return response with block', async () => {
                const response = await BlockPGRepo.getLastBlock();
                expect(response).to.be.instanceOf(Block);
                expect(response.id).to.be.equal(firstBlock.id);
            });

            after(async () => {
                await BlockPGRepo.deleteById(firstBlock.id);
            });
        });
    });

    describe('getLastNBlockIds', () => {
        context('if at least one block exists', () => {
            let blocks = [];
            const n = config.constants.blockSlotWindow;
            const ids = [];
            before(async () => {
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
                for (let i = 0; i < blocks.length; i++) {
                    await BlockPGRepo.deleteById(blocks[i].id);
                }
            });
        });
    });

    describe('getMany', () => {

        context('if at least one block exists', () => {
            let blocks = [];
            const count = 99;
            before(async () => {
                for (let i = 0; i < count; i++) {
                    const block = await insertBlock();
                    blocks.push(block);
                }
            });

            it('should return response with array of blocks', async () => {
                let response = await BlockPGRepo.getMany();
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(100);
                response = await BlockPGRepo.getMany(100, 38);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(62);
                expect(response[0].id).to.be.equal(blocks[37].id);
                response = await BlockPGRepo.getMany(26, 8);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(26);
                expect(response[0].id).to.be.equal(blocks[7].id);
                expect(response[25].id).to.be.equal(blocks[32].id);
            });

            after(async () => {
                for (let i = 0; i < blocks.length; i++) {
                    await BlockPGRepo.deleteById(blocks[i].id);
                }
            });
        });
    });

    describe('isExist', () => {

        context('if block exists', () => {
            let block;
            before(async () => {
                block = await insertBlock();
            });

            it('should return response with boolean value', async () => {
                let response = await BlockPGRepo.isExist('132');
                expect(response).to.be.false;
                response = await BlockPGRepo.isExist(block.id);
                expect(response).to.be.true;
            });

            after(async () => {
                await BlockPGRepo.deleteById(block.id);
            });
        });
    });

    describe('saveOrUpdate', () => {

        context('if table is present', () => {
            let blocks = [];
            const count = 99;
            before(async () => {
                for (let i = 0; i < count; i++) {
                    blocks.push(getNewBlock());
                }
            });

            it('should save block', async () => {
                await BlockPGRepo.saveOrUpdate(blocks[0]);
                let response = await BlockPGRepo.getMany();
                expect(response).to.be.lengthOf(2);
                expect(response[1].id).to.be.equal(blocks[0].id);
                await BlockPGRepo.saveOrUpdate(blocks);
                response = await BlockPGRepo.getMany();
                expect(response).to.be.lengthOf(100);
                expect(response[99].id).to.be.equal(blocks[98].id);
            });

            after(async () => {
                for (let i = 0; i < blocks.length; i++) {
                    await BlockPGRepo.deleteById(blocks[i].id);
                }
            });
        });
    });
});
