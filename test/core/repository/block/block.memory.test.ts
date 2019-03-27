import { Block } from 'shared/model/block';
import BlockRepo from 'core/repository/block/index';
import { expect } from 'chai';
import {
    getNewBlock
} from 'test/core/repository/block/mock';
import config from 'shared/config';

const getAllBlocks = () => {
    return BlockRepo.getMany(Number.MAX_SAFE_INTEGER);
};

describe('Block memory repository', () => {

    describe('function \'getGenesisBlock\'', () => {

        context('when block exists', () => {

            it('should return response with genesis block data (blockId = 1)', () => {
                const response = BlockRepo.getGenesisBlock();
                expect(response).to.be.an.instanceOf(Block);
                expect(response.height).to.be.equal(1);
            });
        });
    });

    describe('function \'add\'', () => {

        context('when add one block', () => {
            let firstBlock;

            before(() => {
                firstBlock = getNewBlock();
            });

            it('should add block to repo and return added block', () => {
                const response = BlockRepo.add(firstBlock);
                expect(response).to.be.an.instanceOf(Block);
                expect(response.id).to.be.equal(firstBlock.id);
                const blocks = getAllBlocks();
                expect(blocks).to.be.lengthOf(2);
                expect(blocks[1].id).to.be.equal(firstBlock.id);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
            });
        });

        context('when add two blocks', () => {

            let firstBlock, secondBlock;

            before(() => {
                firstBlock = getNewBlock();
                secondBlock = getNewBlock();
            });

            it('should add two blocks to repo', () => {
                BlockRepo.add(firstBlock);
                BlockRepo.add(secondBlock);
                const blocks = getAllBlocks();
                expect(blocks).to.be.lengthOf(3);
                expect(blocks[1].id).to.be.equal(firstBlock.id);
                expect(blocks[2].id).to.be.equal(secondBlock.id);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
                BlockRepo.deleteLastBlock();
            });
        });
    });

    describe('lastBlock usage', () => {

        let block1, block2;

        before(() => {
            block1 = getNewBlock();
            block2 = getNewBlock();
        });

        it('should set and get lastBlock', () => {
            BlockRepo.add(block1);
            let response = BlockRepo.getLastBlock();
            expect(response).to.be.eql(block1);
            BlockRepo.add(block2);
            response = BlockRepo.getLastBlock();
            expect(response).to.be.eql(block2);
        });

        after(() => {
            BlockRepo.deleteLastBlock();
            BlockRepo.deleteLastBlock();
        });
    });

    describe('function \'deleteLastBlock\'', () => {

        context('when deleting last block', () => {
            let block1, block2;

            before(() => {
                block1 = getNewBlock();
                block2 = getNewBlock();
                BlockRepo.add(block1);
                BlockRepo.add(block2);
            });

            it('should return previous block from block chain in repo and set lastBlock', () => {
                const response = BlockRepo.deleteLastBlock();
                expect(response).to.be.eql(block1);
                expect(BlockRepo.getLastBlock()).to.be.eql(block1);
                const blocks = getAllBlocks();
                expect(blocks).to.be.lengthOf(2);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
            });
        });
    });

    describe('function \'isExist\'', () => {

        context('when checking block for existence', () => {

            let block1, block2;

            before(() => {
                block1 = getNewBlock();
                block2 = getNewBlock();
                BlockRepo.add(block1);
                BlockRepo.add(block2);
            });

            it('should return false if block doesn\'t exist', () => {
                let response = BlockRepo.isExist('a1b2c3d4');
                expect(response).to.be.false;
                response = BlockRepo.isExist('d1c2b3a4');
                expect(response).to.be.false;
            });

            it('should return true if block exists', () => {
                let response = BlockRepo.isExist(block2.id);
                expect(response).to.be.true;
                response = BlockRepo.isExist(block1.id);
                expect(response).to.be.true;
            });

            after(() => {
                BlockRepo.deleteLastBlock();
                BlockRepo.deleteLastBlock();
            });
        });
    });

    describe('function \'getMany\'', () => {

        context('when getting pack of blocks', () => {

            let firstBlock, lastBlock;
            const blocksCount = 100;
            const blocks = [];

            before(() => {
                firstBlock = getNewBlock();
                BlockRepo.deleteLastBlock();
                blocks.push(firstBlock);
                BlockRepo.add(firstBlock);
                for (let i = 0; i < (blocksCount - 2); i++) {
                    const newBlock = getNewBlock();
                    blocks.push(newBlock);
                    BlockRepo.add(newBlock);
                }
                lastBlock = getNewBlock();
                blocks.push(lastBlock);
                BlockRepo.add(lastBlock);
            });

            it('should return empty array if height of first requested block is less than presented in repo', () => {
                const response = BlockRepo.getMany(100, firstBlock.height - 6);
                expect(response).to.be.lengthOf(0);
            });

            it('should return requested amount of blocks or less', () => {
                let response = BlockRepo.getMany(10, firstBlock.height + 5);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(10);
                expect(response[0]).to.be.eql(blocks[5]);
                expect(response[response.length - 1]).to.be.eql(blocks[14]);

                response = BlockRepo.getMany(20, lastBlock.height - 8);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(9);
                expect(response[0]).to.be.eql(blocks[blocks.length - 9]);
                expect(response[response.length - 1]).to.be.eql(blocks[blocks.length - 1]);
            });

            after(() => {
                for (let i = 0; i < blocks.length; i++) {
                    BlockRepo.deleteLastBlock();
                }
                BlockRepo.add(new Block(config.genesisBlock));
            });
        });
    });
});
