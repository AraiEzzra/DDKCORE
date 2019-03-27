import { Transaction } from 'shared/model/transaction';
import TransactionPGRepo from 'core/repository/transaction/pg';
import BlockPGRepo from 'core/repository/block/pg';
import { expect } from 'chai';
import {
    getNewTransactionWithBlockId, getNewTransactionWithRandomBlockId, setBlocksIds
} from 'test/core/repository/transaction/mock';
import { getNewBlock } from 'test/core/repository/block/mock';
import config from 'shared/config';

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const genesisBlockTrsCount = config.GENESIS_BLOCK.transactionCount;

describe('Transaction repository', () => {

    const blocks = [];

    before(async () => {
        for (let i = 0; i < 3; i++) {
            blocks.push(getNewBlock());
        }
        await BlockPGRepo.saveOrUpdate(blocks);
        setBlocksIds(blocks.map(block => block.id));
    });

    describe('deleteById', () => {

        context('if deleting transaction exists', () => {
            let newTransaction;
            before(async () => {
                newTransaction = getNewTransactionWithRandomBlockId();
                await TransactionPGRepo.saveOrUpdate(newTransaction);
            });

            it('should return response with transaction id', async () => {
                const response = await TransactionPGRepo.deleteById(newTransaction.id);
                expect(response).to.be.lengthOf(1);
                expect(response[0]).to.be.eq(newTransaction.id);
            });

            after(async () => {
                await TransactionPGRepo.deleteById(newTransaction.id);
            });
        });

        context('if deleting transaction exist', () => {
            let firstTransaction, secondTransaction, thirdTransaction;
            before(async () => {
                firstTransaction = getNewTransactionWithRandomBlockId();
                await TransactionPGRepo.saveOrUpdate(firstTransaction);
                secondTransaction = getNewTransactionWithRandomBlockId();
                await TransactionPGRepo.saveOrUpdate(secondTransaction);
                thirdTransaction = getNewTransactionWithRandomBlockId();
                await TransactionPGRepo.saveOrUpdate(thirdTransaction);
            });

            it('should return response with transaction id', async () => {
                const response = await TransactionPGRepo.deleteById([firstTransaction.id, thirdTransaction.id]);
                expect(response).to.be.lengthOf(2);
                expect(response[0]).to.be.eq(firstTransaction.id);
                expect(response[1]).to.be.eq(thirdTransaction.id);
                const existingTransactions = await TransactionPGRepo.getMany(100, 0);
                expect(existingTransactions).to.be.lengthOf(1 + genesisBlockTrsCount);
                expect(existingTransactions[existingTransactions.length - 1].id).to.be.equal(secondTransaction.id);
            });

            after(async () => {
                await await TransactionPGRepo.deleteById(firstTransaction.id);
                await await TransactionPGRepo.deleteById(secondTransaction.id);
                await await TransactionPGRepo.deleteById(thirdTransaction.id);
            });
        });
    });

    describe('getById', () => {

        context('if requested transaction exists', () => {
            let firstTransaction;
            before(async () => {
                firstTransaction = getNewTransactionWithRandomBlockId();
                await TransactionPGRepo.saveOrUpdate(firstTransaction);
            });

            it('should return response with Transaction', async () => {
                const response = await TransactionPGRepo.getById(firstTransaction.id);
                expect(response).to.be.instanceOf(Transaction);
                expect(response.id).to.be.equal(firstTransaction.id);
            });

            after(async () => {
                await await TransactionPGRepo.deleteById(firstTransaction.id);
            });
        });
    });

    describe('getByBlockIds', () => {

        context('if at least one transaction exists', () => {
            const transactionsCount2 = 20;
            const transactionsCount4 = 20;
            const transactionsCount6 = 20;
            const transactions = [];

            before(async () => {
                for (let i = 0; i < transactionsCount2; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blocks[0].id);
                    transactions.push(newTransaction);
                    await TransactionPGRepo.saveOrUpdate(newTransaction);
                }
                for (let i = 0; i < transactionsCount4; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blocks[1].id);
                    transactions.push(newTransaction);
                    await TransactionPGRepo.saveOrUpdate(newTransaction);
                }
                for (let i = 0; i < transactionsCount6; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blocks[2].id);
                    transactions.push(newTransaction);
                    await TransactionPGRepo.saveOrUpdate(newTransaction);
                }
            });

            it('should return empty array, if there is no transactions in block or block doesn\'t exists', async () => {
                let response = await TransactionPGRepo.getByBlockIds(['123'])['123'];
                expect(response).to.be.empty;
            });

            it('should return response with transactions mapped to their own blockIds', async () => {
                let block2Trs = (await TransactionPGRepo.getByBlockIds([blocks[0].id]))[blocks[0].id];
                let block4Trs = (await TransactionPGRepo.getByBlockIds([blocks[1].id]))[blocks[1].id];
                let block6Trs = (await TransactionPGRepo.getByBlockIds([blocks[2].id]))[blocks[2].id];
                expect(block2Trs.length).to.be.equal(transactionsCount2);
                expect(block4Trs.length).to.be.equal(transactionsCount4);
                expect(block6Trs.length).to.be.equal(transactionsCount6);
            });

            after(async () => {
                for (let i = 0; i < transactions.length; i++) {
                    await await TransactionPGRepo.deleteById(transactions[i].id);
                }
            });
        });
    });

    describe('getMany', () => {

        context('if at least one transaction exists', () => {
            let transactions = [];
            const count = 99;
            before(async () => {
                for (let i = 0; i < count; i++) {
                    const transaction = getNewTransactionWithRandomBlockId();
                    await TransactionPGRepo.saveOrUpdate(transaction);
                    transactions.push(transaction);
                }
            });

            it('should return response with array of transactions', async () => {
                let response = await TransactionPGRepo.getMany(1000, 0);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(99 + genesisBlockTrsCount);
                response = await TransactionPGRepo.getMany(1000, 38);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(61 + genesisBlockTrsCount);
                response = await TransactionPGRepo.getMany(26, 8);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(26);
            });

            after(async () => {
                for (let i = 0; i < transactions.length; i++) {
                    await await TransactionPGRepo.deleteById(transactions[i].id);
                }
            });
        });
    });

    describe('isExist', () => {

        context('if transaction exists', () => {
            let transaction;
            before(async () => {
                transaction = getNewTransactionWithRandomBlockId();
                await TransactionPGRepo.saveOrUpdate(transaction);
            });

            it('should return response with boolean value', async () => {
                let response = await TransactionPGRepo.isExist('132');
                expect(response).to.be.false;
                response = await TransactionPGRepo.isExist(transaction.id);
                expect(response).to.be.true;
            });

            after(async () => {
                await await TransactionPGRepo.deleteById(transaction.id);
            });
        });
    });

    describe('saveOrUpdate', () => {

        context('if table is present', () => {
            let transactions = [];
            const count = 99;
            before(async () => {
                for (let i = 0; i < count; i++) {
                    transactions.push(getNewTransactionWithRandomBlockId());
                }
            });

            it('should save block', async () => {
                await TransactionPGRepo.saveOrUpdate(transactions[0]);
                let response = await TransactionPGRepo.getMany(1000, 0);
                expect(response).to.be.lengthOf(1 + genesisBlockTrsCount);
                await TransactionPGRepo.saveOrUpdate(transactions);
                response = await TransactionPGRepo.getMany(1000, 0);
                expect(response).to.be.lengthOf(99 + genesisBlockTrsCount);
            });

            after(async () => {
                for (let i = 0; i < transactions.length; i++) {
                    await await TransactionPGRepo.deleteById(transactions[i].id);
                }
            });
        });
    });

    after(async () => {
        for (let i = 0; i < blocks.length; i++) {
            await BlockPGRepo.deleteById(blocks[i].id);
        }
    });
});
