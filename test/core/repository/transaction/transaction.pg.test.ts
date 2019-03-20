import db from 'shared/driver/db/index';
import { Transaction } from 'shared/model/transaction';
import TransactionPGRepo from 'core/repository/transaction/pg';
import { expect } from 'chai';
import {
    getNewTransactionWithBlockId, getNewTransactionWithRandomBlockId,
    blockId2, blockId4, blockId6, createTrsTable, dropTrsTable
} from 'test/core/repository/transaction/mock';

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const insertTransaction = async (transaction, ) => {
    await db.query(`INSERT INTO trs(id, block_id, type, created_at, sender_public_key, signature, salt, asset)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`, [
        transaction.id,
        transaction.blockId,
        transaction.type,
        Date.now() / 1000,
        transaction.senderPublicKey,
        transaction.signature,
        transaction.salt,
        transaction.asset
    ]);
};

describe('Transaction repository', () => {

    describe('deleteById', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await TransactionPGRepo.deleteById('');
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createTrsTable();
            });

            it('should return response with empty array', async () => {
                const response = await TransactionPGRepo.deleteById('');
                expect(response).to.be.lengthOf(0);
            });

            after(async () => {
                await dropTrsTable();
            });
        });

        context('if deleting transaction exists', () => {
            let newTransaction;
            before(async () => {
                await createTrsTable();
                newTransaction = getNewTransactionWithRandomBlockId();
                await insertTransaction(newTransaction);
            });

            it('should return response with transaction id', async () => {
                const response = await TransactionPGRepo.deleteById(newTransaction.id);
                expect(response).to.be.lengthOf(1);
                expect(response[0]).to.be.eq(newTransaction.id);
            });

            after(async () => {
                await dropTrsTable();
            });
        });

        context('if deleting transaction exist', () => {
            let firstTransaction, secondTransaction, thirdTransaction;
            before(async () => {
                await createTrsTable();
                firstTransaction = getNewTransactionWithRandomBlockId();
                await insertTransaction(firstTransaction);
                secondTransaction = getNewTransactionWithRandomBlockId();
                await insertTransaction(secondTransaction);
                thirdTransaction = getNewTransactionWithRandomBlockId();
                await insertTransaction(thirdTransaction);
            });

            it('should return response with transaction id', async () => {
                const response = await TransactionPGRepo.deleteById([firstTransaction.id, thirdTransaction.id]);
                expect(response).to.be.lengthOf(2);
                expect(response[0]).to.be.eq(firstTransaction.id);
                expect(response[1]).to.be.eq(thirdTransaction.id);
                const existingTransactions = await TransactionPGRepo.getMany(100, 0);
                expect(existingTransactions).to.be.lengthOf(1);
                expect(existingTransactions[0].id).to.be.equal(secondTransaction.id);
            });

            after(async () => {
                await dropTrsTable();
            });
        });
    });

    describe('getById', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await TransactionPGRepo.getById('');
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createTrsTable();
            });

            it('should return undefined', async () => {
                const response = await TransactionPGRepo.getById('');
                expect(response).to.be.undefined;
            });

            after(async () => {
                await dropTrsTable();
            });
        });

        context('if requested transaction exists', () => {
            let firstTransaction;
            before(async () => {
                await createTrsTable();
                firstTransaction = getNewTransactionWithRandomBlockId();
                await insertTransaction(firstTransaction);
            });

            it('should return response with Transaction', async () => {
                const response = await TransactionPGRepo.getById(firstTransaction.id);
                expect(response).to.be.instanceOf(Transaction);
                expect(response.id).to.be.equal(firstTransaction.id);
            });

            after(async () => {
                await dropTrsTable();
            });
        });
    });

    describe('getByBlockIds', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await TransactionPGRepo.getByBlockIds([]);
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createTrsTable();
            });

            it('should return empty object', async () => {
                const response = await TransactionPGRepo.getByBlockIds(['123', '123']);
                expect(response).to.be.empty;
            });

            after(async () => {
                await dropTrsTable();
            });
        });

        context('if at least one transaction exists', () => {
            const transactionsCount2 = 20;
            const transactionsCount4 = 20;
            const transactionsCount6 = 20;

            before(async () => {
                await createTrsTable();
                for (let i = 0; i < transactionsCount2; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blockId2);
                    await insertTransaction(newTransaction);
                }
                for (let i = 0; i < transactionsCount4; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blockId4);
                    await insertTransaction(newTransaction);
                }
                for (let i = 0; i < transactionsCount6; i++) {
                    const newTransaction = getNewTransactionWithBlockId(blockId6);
                    await insertTransaction(newTransaction);
                }
            });

            it('should return empty array, if there is no transactions in block or block doesn\'t exists', async () => {
                let response = await TransactionPGRepo.getByBlockIds(['123'])['123'];
                expect(response).to.be.empty;
            });

            it('should return response with transactions mapped to their own blockIds', async () => {
                let block2Trs = (await TransactionPGRepo.getByBlockIds([blockId2]))[blockId2];
                let block4Trs = (await TransactionPGRepo.getByBlockIds([blockId4]))[blockId4];
                let block6Trs = (await TransactionPGRepo.getByBlockIds([blockId6]))[blockId6];
                expect(block2Trs.length).to.be.equal(transactionsCount2);
                expect(block4Trs.length).to.be.equal(transactionsCount4);
                expect(block6Trs.length).to.be.equal(transactionsCount6);
            });

            after(async () => {
                await dropTrsTable();
            });
        });
    });

    describe('getMany', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await TransactionPGRepo.getMany(100, 0);
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createTrsTable();
            });

            it('should return empty array', async () => {
                const response = await TransactionPGRepo.getMany(100, 0);
                expect(response).to.be.empty;
            });

            after(async () => {
                await dropTrsTable();
            });
        });

        context('if at least one transaction exists', () => {
            let transactions = [];
            const count = 99;
            before(async () => {
                await createTrsTable();
                for (let i = 0; i < count; i++) {
                    const transaction = getNewTransactionWithRandomBlockId();
                    await insertTransaction(transaction);
                    transactions.push(transaction);
                }
            });

            it('should return response with array of transactions', async () => {
                let response = await TransactionPGRepo.getMany(1000, 0);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(99);
                response = await TransactionPGRepo.getMany(1000, 38);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(61);
                expect(response[0].id).to.be.equal(transactions[38].id);
                response = await TransactionPGRepo.getMany(26, 8);
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(26);
                expect(response[0].id).to.be.equal(transactions[8].id);
                expect(response[25].id).to.be.equal(transactions[33].id);
            });

            after(async () => {
                await dropTrsTable();
            });
        });
    });

    describe('isExist', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await TransactionPGRepo.isExist('');
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present but empty', () => {
            before(async () => {
                await createTrsTable();
            });

            it('should return null', async () => {
                const response = await TransactionPGRepo.isExist('');
                expect(response).to.be.false;
            });

            after(async () => {
                await dropTrsTable();
            });
        });

        context('if transaction exists', () => {
            let transaction;
            before(async () => {
                await createTrsTable();
                transaction = getNewTransactionWithRandomBlockId();
                await insertTransaction(transaction);
            });

            it('should return response with boolean value', async () => {
                let response = await TransactionPGRepo.isExist('132');
                expect(response).to.be.false;
                response = await TransactionPGRepo.isExist(transaction.id);
                expect(response).to.be.true;
            });

            after(async () => {
                await dropTrsTable();
            });
        });
    });

    describe('saveOrUpdate', () => {
        context('without existing table', () => {
            it('should return response with error', async () => {
                try {
                    await TransactionPGRepo.saveOrUpdate(getNewTransactionWithRandomBlockId());
                } catch (err) {
                    expect(err).to.exist;
                }
            });
        });

        context('if table is present', () => {
            let transactions = [];
            const count = 99;
            before(async () => {
                await createTrsTable();
                for (let i = 0; i < count; i++) {
                    transactions.push(getNewTransactionWithRandomBlockId());
                }
            });

            it('should save block', async () => {
                await TransactionPGRepo.saveOrUpdate(transactions[0]);
                let response = await TransactionPGRepo.getMany(1000, 0);
                expect(response).to.be.lengthOf(1);
                expect(response[0].id).to.be.equal(transactions[0].id);
                await TransactionPGRepo.saveOrUpdate(transactions);
                response = await TransactionPGRepo.getMany(1000, 0);
                expect(response).to.be.lengthOf(99);
                expect(response[98].id).to.be.equal(transactions[98].id);
            });

            after(async () => {
                await dropTrsTable();
            });
        });
    });
});
