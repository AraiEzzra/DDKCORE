import TransactionRepo from 'core/repository/transaction/index';
import { expect } from 'chai';
import {
    getNewTransaction,
    getNewTransactionWithBlockId,
    blockId2,
    blockId4,
    blockId6,
    getNewTransactionWithRandomBlockIdFromList
} from 'test/core/repository/transaction/mock';
import { Transaction } from 'shared/model/transaction';
import config from 'shared/config';

const getAllByBlockId = (blockId) => {
    return TransactionRepo.getByBlockIds([blockId])[blockId];
};

const genesisBlockTrsCount = config.GENESIS_BLOCK.transactionCount;

describe('Transaction memory repository', () => {

    describe('function \'add\'', () => {

        context('when add one transaction', () => {

            const firstTransaction = getNewTransactionWithBlockId(blockId2);

            it('should add transaction to repo and return added transaction', () => {
                const response = TransactionRepo.add(firstTransaction);
                expect(response).to.be.an.instanceOf(Transaction);
                expect(response.id).to.be.equal(firstTransaction.id);
                const transactions = TransactionRepo.getAll();
                expect(transactions).to.be.lengthOf(1 + genesisBlockTrsCount);
                expect(transactions[0 + genesisBlockTrsCount].id).to.be.equal(firstTransaction.id);
                const transactionsByBlock = getAllByBlockId(blockId2);
                expect(transactionsByBlock).to.be.lengthOf(1);
                expect(transactionsByBlock[0].id).to.be.equal(firstTransaction.id);
            });

            after(() => {
                TransactionRepo.delete(firstTransaction);
            });
        });

        context('when add two transactions', () => {

            const firstTransaction = getNewTransactionWithBlockId(blockId2);
            const secondTransaction = getNewTransactionWithBlockId(blockId2);

            it('should add two blocks to repo', () => {
                TransactionRepo.add(firstTransaction);
                TransactionRepo.add(secondTransaction);
                const transactions = TransactionRepo.getAll();
                expect(transactions).to.be.lengthOf(2 + genesisBlockTrsCount);
                expect(transactions[0 + genesisBlockTrsCount].id).to.be.equal(firstTransaction.id);
                expect(transactions[1 + genesisBlockTrsCount].id).to.be.equal(secondTransaction.id);
                const transactionsByBlock = getAllByBlockId(blockId2);
                expect(transactionsByBlock).to.be.lengthOf(2);
                expect(transactionsByBlock[0].id).to.be.equal(firstTransaction.id);
                expect(transactionsByBlock[1].id).to.be.equal(secondTransaction.id);
            });

            after(() => {
                TransactionRepo.delete(firstTransaction);
                TransactionRepo.delete(secondTransaction);
            });
        });
    });

    describe('function \'delete\'', () => {

        context('when deleting transaction', () => {

            const firstTransaction = getNewTransactionWithBlockId(blockId2);
            const secondTransaction = getNewTransactionWithBlockId(blockId2);

            before(() => {
                TransactionRepo.add(firstTransaction);
                TransactionRepo.add(secondTransaction);
            });

            it('should return id', () => {
                let response = TransactionRepo.delete(firstTransaction);
                expect(response).to.be.equal(firstTransaction.id);
                let transactions = TransactionRepo.getAll();
                expect(transactions).to.be.lengthOf(1 + genesisBlockTrsCount);
                let transactionsByBlock = getAllByBlockId(blockId2);
                expect(transactionsByBlock).to.be.lengthOf(1);

                response = TransactionRepo.delete(secondTransaction);
                expect(response).to.be.equal(secondTransaction.id);
                transactions = TransactionRepo.getAll();
                expect(transactions).to.be.lengthOf(0 + genesisBlockTrsCount);
                transactionsByBlock = getAllByBlockId(blockId2);
                expect(transactionsByBlock).to.be.lengthOf(0);
            });

        });
    });

    describe('function \'getAll\'', () => {

        context('when getting pack of transactions', () => {

            const transactionsCount = 100;
            const transactions = [];

            before(() => {
                for (let i = 0; i < transactionsCount; i++) {
                    const newTransaction = getNewTransactionWithRandomBlockIdFromList();
                    transactions.push(newTransaction);
                    TransactionRepo.add(newTransaction);
                }
            });

            it('should return requested amount of blocks or less', () => {
                let response = TransactionRepo.getAll();
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(transactionsCount + genesisBlockTrsCount);

                let block2Trs = TransactionRepo.getByBlockIds([blockId2])[blockId2];
                let block4Trs = TransactionRepo.getByBlockIds([blockId4])[blockId4];
                let block6Trs = TransactionRepo.getByBlockIds([blockId6])[blockId6];
                expect(block2Trs.length + block4Trs.length + block6Trs.length).to.be.equal(transactionsCount);
            });

            after(() => {
                for (let i = 0; i < transactionsCount; i++) {
                    TransactionRepo.delete(transactions[i]);
                }
            });
        });
    });

    describe('function \'getByBlockIds\'', () => {

        context('when getting pack of transactions', () => {

            const transactionsCount2 = 20;
            const transactionsCount4 = 20;
            const transactionsCount6 = 20;
            const transactions = [];

            before(() => {
                for (let i = 0; i < transactionsCount2; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blockId2);
                    transactions.push(newTransaction);
                    TransactionRepo.add(newTransaction);
                }
                for (let i = 0; i < transactionsCount4; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blockId4);
                    transactions.push(newTransaction);
                    TransactionRepo.add(newTransaction);
                }
                for (let i = 0; i < transactionsCount6; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blockId6);
                    transactions.push(newTransaction);
                    TransactionRepo.add(newTransaction);
                }
            });

            it('should return empty array, if there is no transactions in block or block doesn\'t exists', () => {
                let response = TransactionRepo.getByBlockIds(['123'])['123'];
                expect(response).to.be.undefined;
            });

            it('should return requested amount of blocks or less', () => {
                let response = TransactionRepo.getAll();
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(transactionsCount2 + transactionsCount4 + transactionsCount6 + genesisBlockTrsCount);

                let block2Trs = TransactionRepo.getByBlockIds([blockId2])[blockId2];
                let block4Trs = TransactionRepo.getByBlockIds([blockId4])[blockId4];
                let block6Trs = TransactionRepo.getByBlockIds([blockId6])[blockId6];
                expect(block2Trs.length).to.be.equal(transactionsCount2);
                expect(block4Trs.length).to.be.equal(transactionsCount4);
                expect(block6Trs.length).to.be.equal(transactionsCount6);
            });

            after(() => {
                for (let i = 0; i < transactions.length; i++) {
                    TransactionRepo.delete(transactions[i]);
                }
            });
        });
    });

    describe('function \'getById\'', () => {

        context('when transaction by id', () => {

            const transactionsCount = 100;
            const transactions = [];

            before(() => {
                for (let i = 0; i < transactionsCount; i++) {
                    const newTransaction = getNewTransactionWithRandomBlockIdFromList();
                    transactions.push(newTransaction);
                    TransactionRepo.add(newTransaction);
                }
            });

            it('should return null if transaction does\'t exist', () => {
                let response = TransactionRepo.getById('123');
                expect(response).to.be.undefined;
            });

            it('should return requested amount of blocks or less', () => {
                let response = TransactionRepo.getById(transactions[0].id);
                expect(response).to.be.instanceOf(Transaction);
                expect(response.senderPublicKey).to.be.equal(transactions[0].senderPublicKey);
                response = TransactionRepo.getById(transactions[10].id);
                expect(response).to.be.instanceOf(Transaction);
                expect(response.senderPublicKey).to.be.equal(transactions[10].senderPublicKey);
                response = TransactionRepo.getById(transactions[20].id);
                expect(response).to.be.instanceOf(Transaction);
                expect(response.senderPublicKey).to.be.equal(transactions[20].senderPublicKey);
            });

            after(() => {
                for (let i = 0; i < transactions.length; i++) {
                    TransactionRepo.delete(transactions[i]);
                }
            });
        });
    });

    describe('function \'isExist\'', () => {

        context('when checking transaction for existence', () => {

            const transaction1 = getNewTransaction();
            const transaction2 = getNewTransaction();

            before(() => {
                TransactionRepo.add(transaction1);
                TransactionRepo.add(transaction2);
            });

            it('should return false if transaction doesn\'t exist', () => {
                let response = TransactionRepo.isExist('a1b2c3d4');
                expect(response).to.be.false;
                response = TransactionRepo.isExist('d1c2b3a4');
                expect(response).to.be.false;
            });

            it('should return true if transaction exists', () => {
                let response = TransactionRepo.isExist(transaction1.id);
                expect(response).to.be.true;
                response = TransactionRepo.isExist(transaction2.id);
                expect(response).to.be.true;
            });

            after(() => {
                TransactionRepo.delete(transaction1);
                TransactionRepo.delete(transaction2);
            });
        });
    });
});
