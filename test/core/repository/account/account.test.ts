import { expect } from 'chai';
import { Account } from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import {
    getNewAccount
} from 'test/core/repository/account/mock';

describe('Account repository', () => {

    describe('function \'add\'', () => {

        context('when add one account', () => {

            const firstAccount = getNewAccount();

            it('should add account to repo and return added account', () => {
                const response = AccountRepo.add(firstAccount);
                expect(response).to.be.an.instanceOf(Account);
                expect(response.address).to.be.equal(firstAccount.address);
                const blocks = AccountRepo.getAll();
                expect(blocks).to.be.lengthOf(1);
                expect(blocks[0].address).to.be.equal(firstAccount.address);
            });

            after(() => {
                AccountRepo.delete(firstAccount);
            });
        });

        context('when add two accounts', () => {

            const firstAccount = getNewAccount();
            const secondAccount = getNewAccount();

            it('should add two accounts to repo', () => {
                AccountRepo.add(firstAccount);
                AccountRepo.add(secondAccount);
                const Accounts = AccountRepo.getAll();
                expect(Accounts).to.be.lengthOf(2);
                expect(Accounts[0].address).to.be.equal(firstAccount.address);
                expect(Accounts[1].address).to.be.equal(secondAccount.address);
            });

            after(() => {
                AccountRepo.delete(firstAccount);
                AccountRepo.delete(secondAccount);
            });
        });
    });

    describe('function \'delete\'', () => {

        context('when deleting account', () => {
            const account1 = getNewAccount();
            const account2 = getNewAccount();

            before(() => {
                AccountRepo.add(account1);
                AccountRepo.add(account2);
            });

            it('should delete account from repo', () => {
                AccountRepo.delete(account1);
                let accounts = AccountRepo.getAll();
                expect(accounts).to.be.lengthOf(1);
                expect(accounts[0]).to.be.eql(account2);
                AccountRepo.delete(account2);
                accounts = AccountRepo.getAll();
                expect(accounts).to.be.empty;
            });
        });
    });

    describe('function \'getByAddress\'', () => {

        context('when getting account by address', () => {

            const account1 = getNewAccount();
            const account2 = getNewAccount();

            before(() => {
                AccountRepo.add(account1);
                AccountRepo.add(account2);
            });

            it('should return null if account doesn\'t exist', () => {
                let response = AccountRepo.getByAddress(1000n);
                expect(response).to.be.null;
                response = AccountRepo.getByAddress(2000n);
                expect(response).to.be.null;
            });

            it('should return true if account exists', () => {
                let response = AccountRepo.getByAddress(account1.address);
                expect(response).to.be.eql(account1);
                response = AccountRepo.getByAddress(account2.address);
                expect(response).to.be.eql(account2);
            });

            after(() => {
                AccountRepo.delete(account1);
                AccountRepo.delete(account2);
            });
        });
    });

    describe('function \'getAll\'', () => {

        context('when getting pack of accounts', () => {
            it('should return empty array if repo empty', () => {
                const response = AccountRepo.getAll();
                expect(response).to.be.lengthOf(0);
            });
        });

        context('when getting pack of accounts', () => {

            const accountsCount = 100;
            const accounts = [];

            before(() => {
                for (let i = 0; i < accountsCount; i++) {
                    const newBlock = getNewAccount();
                    accounts.push(newBlock);
                    AccountRepo.add(newBlock);
                }
            });

            it('should return all accounts from repo', () => {
                let response = AccountRepo.getAll();
                expect(response).to.be.an('array');
                expect(response).to.be.lengthOf(100);
                expect(response[0]).to.be.eql(accounts[0]);
                expect(response[response.length - 1]).to.be.eql(accounts[accountsCount - 1]);
            });

            after(() => {
                for (let i = 0; i < accounts.length; i++) {
                    AccountRepo.delete(accounts[i]);
                }
            });
        });
    });

    describe('function \'updateBalance\'', () => {

        context('when updating account balance', () => {

            const account = getNewAccount();

            before(() => {
                AccountRepo.add(account);
            });

            it('should return false if account doesn\'t exist', () => {
                let response = AccountRepo.updateBalance(new Account({ address: 1000n }), 0 );
                expect(response).to.be.false;
            });

            it('should return true and update balance if account exists', () => {
                let response = AccountRepo.updateBalance(account, 1000 );
                expect(response).to.be.true;
                expect(AccountRepo.getByAddress(account.address).actualBalance).to.equal(1000);
            });

            after(() => {
                AccountRepo.delete(account);
            });
        });
    });

    describe('function \'updateBalanceByAddress\'', () => {

        context('when updating balance by address', () => {

            const account = getNewAccount();

            before(() => {
                AccountRepo.add(account);
            });

            it('should return false if account doesn\'t exist', () => {
                let response = AccountRepo.updateBalanceByAddress(1000n, 0 );
                expect(response).to.be.false;
            });

            it('should return true and update balance if account exists', () => {
                let response = AccountRepo.updateBalanceByAddress(account.address, 1000);
                expect(response).to.be.true;
                expect(AccountRepo.getByAddress(account.address).actualBalance).to.equal(1000);
            });

            after(() => {
                AccountRepo.delete(account);
            });
        });
    });

    describe('function \'updateVotes\'', () => {

        context('when updating votes', () => {

            const account = getNewAccount();

            before(() => {
                AccountRepo.add(account);
            });

            it('should return false if account doesn\'t exist', () => {
                let response = AccountRepo.updateVotes(new Account({ address: 1000n }), []);
                expect(response).to.be.false;
            });

            it('should return true and update votes if account exists', () => {
                const votes = ['1', '2', '3'];
                let response = AccountRepo.updateVotes(account, votes);
                expect(response).to.be.true;
                expect(AccountRepo.getByAddress(account.address).votes).to.eql(votes);
            });

            after(() => {
                AccountRepo.delete(account);
            });
        });
    });

    describe('function \'updateReferralByAddress\'', () => {

        context('when updating referrals', () => {

            const account = getNewAccount();

            before(() => {
                AccountRepo.add(account);
            });

            it('should return false if account doesn\'t exist', () => {
                let response = AccountRepo.updateReferralByAddress(1000n, []);
                expect(response).to.be.false;
            });

            it('should return true and update votes if account exists', () => {
                const referrals = [new Account({address: 1n}), new Account({address: 2n}), new Account({address: 3n})];
                let response = AccountRepo.updateReferralByAddress(account.address, referrals);
                expect(response).to.be.true;
                expect(AccountRepo.getByAddress(account.address).referrals).to.eql(referrals);
            });

            after(() => {
                AccountRepo.delete(account);
            });
        });
    });
});
