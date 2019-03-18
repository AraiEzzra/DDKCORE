import { Block } from 'shared/model/block';
import config from 'shared/util/config';
import BlockRepo from 'core/repository/block/index';
import TransactionRepo from 'core/repository/transaction/index';
import BlockService from 'core/service/block';
import { expect } from 'chai';
import {
    getNewBlock, createTrsTable, createBlockTable, dropTrsTable,
    dropBlockTable
} from 'test/core/repository/block/mock';
import {IAsset, Transaction} from 'shared/model/transaction';


const resultTransactions = config.genesisBlock.transactions.map((transaction) =>
    TransactionRepo.deserialize(transaction)
);
config.genesisBlock.transactions = <Array<Transaction<IAsset>>>resultTransactions;
const genesisBlock = new Block(config.genesisBlock);

describe('Block memory repository', () => {

    before(async () => {
        await createBlockTable();
        await createTrsTable();
    });

    describe('function \'getGenesisBlock\'', () => {
        context('when genesis block doesn\'t exist' , () => {
            it('should return response null', () => {
                const response: Block = BlockRepo.getGenesisBlock();
                expect(response).to.be.undefined;
            });
        });

        context('when block exists', () => {

            before(async () => {
                await BlockService.applyGenesisBlock(genesisBlock);
            });

            it('should return response with genesis block data (blockId = 1)', () => {
                const response = BlockRepo.getGenesisBlock();
                expect(response).to.be.an.instanceOf(Block);
                expect(response.height).to.be.equal(1);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
            });
        });
    });

    describe('function \'add\'', () => {

        context('when add one block', () => {

            const firstBlock = getNewBlock();

            it('should add block to repo and return added block', () => {
                const response = BlockRepo.add(firstBlock);
                expect(response).to.be.an.instanceOf(Block);
                expect(response.id).to.be.equal(firstBlock.id);
                const blocks = BlockRepo.getMany();
                expect(blocks).to.be.lengthOf(1);
                expect(blocks[0].id).to.be.equal(firstBlock.id);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
            });
        });

        context('when add two blocks', () => {

            const firstBlock = getNewBlock();
            const secondBlock = getNewBlock();

            it('should add two blocks to repo', () => {
                BlockRepo.add(firstBlock);
                BlockRepo.add(secondBlock);
                const blocks = BlockRepo.getMany();
                expect(blocks).to.be.lengthOf(2);
                expect(blocks[0].id).to.be.equal(firstBlock.id);
                expect(blocks[1].id).to.be.equal(secondBlock.id);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
                BlockRepo.deleteLastBlock();
            });
        });
    });

    describe('lastBlock usage', () => {

        const block1 = getNewBlock();
        const block2 = getNewBlock();

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

            it('should return null if there is no blocks in repo', () => {
                const response = BlockRepo.deleteLastBlock();
                expect(response).to.be.null;
            });

        });

        context('when deleting last block', () => {
            const block1 = getNewBlock();
            const block2 = getNewBlock();

            before(() => {
                BlockRepo.add(block1);
                BlockRepo.add(block2);
            });

            it('should return previous block from block chain in repo and set lastBlock', () => {
                const response = BlockRepo.deleteLastBlock();
                expect(response).to.be.eql(block1);
                expect(BlockRepo.getLastBlock()).to.be.eql(block1);
                const blocks = BlockRepo.getMany();
                expect(blocks).to.be.lengthOf(1);
            });

            after(() => {
                BlockRepo.deleteLastBlock();
            });
        });
    });

    // describe('lastNBlocks usage', () => {
    //
    //     const addition = 10;
    //     const blocks = [];
    //     for (let i = 0; i < (config.constants.blockSlotWindow + addition); i++) {
    //         blocks.push(getNewBlock().id);
    //     }
    //
    //     context('when setting lastNBlocks', () => {
    //         it('should set and get lastNBlocks', () => {
    //             BlockRepo.setLastNBlocks([blocks[0], blocks[1]]);
    //             let response = BlockRepo.getLastNBlockIds();
    //             expect(response).to.be.eql([blocks[0], blocks[1]]);
    //         });
    //
    //         after(() => {
    //             BlockRepo.setLastNBlocks([]);
    //         });
    //     });
    //
    //     context('when appending lastNBlocks', () => {
    //         it('should shift lastNBlocks array', () => {
    //             blocks.forEach((blockId) => {
    //                 BlockRepo.appendInLastNBlocks(blockId);
    //             });
    //             let response = BlockRepo.getLastNBlockIds();
    //             expect(response).to.be.lengthOf(config.constants.blockSlotWindow);
    //             expect(response[0]).to.be.eql(blocks[config.constants.blockSlotWindow - addition]);
    //         });
    //     });
    // });

    describe('function \'isExist\'', () => {

        context('when checking block for existence', () => {

            const block1 = getNewBlock();
            const block2 = getNewBlock();

            before(() => {
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
                const response = BlockRepo.getMany(firstBlock.height - 6);
                expect(response).to.be.lengthOf(0);
            });

            it('should return requested amount of blocks or less', () => {
                let response = BlockRepo.getMany(firstBlock.height + 5, 10);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(10);
                expect(response[0]).to.be.eql(blocks[6]);
                expect(response[response.length - 1]).to.be.eql(blocks[15]);

                response = BlockRepo.getMany(lastBlock.height - 8, 20);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(8);
                expect(response[0]).to.be.eql(blocks[blocks.length - 8]);
                expect(response[response.length - 1]).to.be.eql(blocks[blocks.length - 1]);
            });

            after(() => {
                for (let i = 0; i < blocks.length; i++) {
                    BlockRepo.deleteLastBlock();
                }
            });
        });
    });

    after(async () => {
        await dropTrsTable();
        await dropBlockTable();
    });
});
