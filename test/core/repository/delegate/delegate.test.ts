import { expect } from 'chai';
import { Delegate } from 'shared/model/delegate';
import DelegateRepo from 'core/repository/delegate';
import {
    getNewDelegateName
} from 'test/core/repository/delegate/mock';
import {
    getNewAccount
} from 'test/core/repository/account/mock';
import config from 'shared/config';

describe('Delegate repository', () => {

    describe('function \'add\'', () => {

        context('when add one delegate', () => {

            const rawDelegate = { account: getNewAccount(), username: getNewDelegateName() };

            it('should create delegate and add it to repo returning the entity', () => {
                const response = DelegateRepo.add(rawDelegate.account, { username: rawDelegate.username });
                expect(response).to.be.an.instanceOf(Delegate);
                expect(response.account).to.be.eql(rawDelegate.account);
                expect(response.username).to.be.equal(rawDelegate.username);
                const delegate = DelegateRepo.getByPublicKey(rawDelegate.account.publicKey);
                expect(delegate.account).to.be.eql(rawDelegate.account);
                expect(delegate.username).to.be.eql(rawDelegate.username);
            });

            after(() => {
                DelegateRepo.delete(rawDelegate.account);
            });
        });

        context('when add two delegates', () => {

            const rawDelegate1 = { account: getNewAccount(), username: getNewDelegateName() };
            const rawDelegate2 = { account: getNewAccount(), username: getNewDelegateName() };

            it('should add two Delegates to repo', () => {
                DelegateRepo.add(rawDelegate1.account, { username: rawDelegate1.username });
                DelegateRepo.add(rawDelegate2.account, { username: rawDelegate2.username });
                const delegate1 = DelegateRepo.getByPublicKey(rawDelegate1.account.publicKey);
                const delegate2 = DelegateRepo.getByPublicKey(rawDelegate2.account.publicKey);
                expect(delegate1.username).to.be.equal(rawDelegate1.username);
                expect(delegate2.username).to.be.equal(delegate2.username);
            });

            after(() => {
                DelegateRepo.delete(rawDelegate1.account);
                DelegateRepo.delete(rawDelegate2.account);
            });
        });
    });

    describe('function \'getActiveDelegates\'', () => {

        context('when getting active delegates from empty repo', () => {
            it(`should return empty array`, () => {
                let activeDelegates = DelegateRepo.getActiveDelegates();
                expect(activeDelegates).to.be.empty;
            });
        });

        context('when getting active delegates which count is less than required', () => {

            const rawDelegates = [];
            const delegatesCount = config.CONSTANTS.ACTIVE_DELEGATES - 1;
            for (let i = 0; i < delegatesCount; i++) {
                rawDelegates.push({ account: getNewAccount(), username: getNewDelegateName() });
            }

            before(() => {
                for (let i = 0; i < delegatesCount; i++) {
                    DelegateRepo.add(rawDelegates[i].account, { username: rawDelegates[i].account.username });
                }
            });

            it(`should return ${delegatesCount} delegates from repo`, () => {
                let activeDelegates = DelegateRepo.getActiveDelegates();
                expect(activeDelegates).to.be.lengthOf(delegatesCount);
            });

            after(() => {
                for (let i = 0; i < delegatesCount; i++) {
                    DelegateRepo.delete(rawDelegates[i].account);
                }
            });
        });

        context('when getting active delegates', () => {

            const rawDelegates = [];
            const delegatesCount = 100;
            for (let i = 0; i < delegatesCount; i++) {
                rawDelegates.push({ account: getNewAccount(), username: getNewDelegateName() });
            }

            before(() => {
                for (let i = 0; i < delegatesCount; i++) {
                    DelegateRepo.add(rawDelegates[i].account, { username: rawDelegates[i].account.username });
                }
                let delegate = DelegateRepo.getByPublicKey(rawDelegates[0].account.publicKey);
                delegate.votes = 5;
                for (let i = 1; i < 6; i++) {
                    delegate = DelegateRepo.getByPublicKey(rawDelegates[i].account.publicKey);
                    delegate.votes = 1;
                }
            });

            it(`should return ${config.CONSTANTS.ACTIVE_DELEGATES} delegates from repo`, () => {
                let activeDelegates = DelegateRepo.getActiveDelegates();
                expect(activeDelegates).to.be.lengthOf(config.CONSTANTS.ACTIVE_DELEGATES);
                expect(activeDelegates[0].account).to.be.eql(rawDelegates[0].account)   ;
            });

            after(() => {
                for (let i = 0; i < delegatesCount; i++) {
                    DelegateRepo.delete(rawDelegates[i].account);
                }
            });
        });
    });

    describe('function \'update\'', () => {

        context('when updating delegate which is not presented in repo', () => {

            it('should return false', () => {
                let response = DelegateRepo.update(new Delegate({ username: 'username' }));
                expect(response).to.be.false;
            });
        });

        context('when updating delegate', () => {

            const rawDelegate = { account: getNewAccount(), username: getNewDelegateName() };
            const delegate = new Delegate({ account: rawDelegate.account, username: 'delegate-user' });

            before(() => {
                DelegateRepo.add(rawDelegate.account, { username: rawDelegate.username });
            });

            it('should return true and update entity', () => {
                let response = DelegateRepo.update(delegate);
                expect(response).to.be.true;
                let updatedDelegate = DelegateRepo.getByPublicKey(rawDelegate.account.publicKey);
                expect(updatedDelegate.username).to.be.eql(delegate.username);
            });

            after(() => {
                DelegateRepo.delete(rawDelegate.account);
            });
        });
    });

    describe('function \'getByPublicKey\'', () => {

        context('when getting delegate which is not presented in repo', () => {
            it('should return undefined', () => {
                let response = DelegateRepo.getByPublicKey('');
                expect(response).to.be.undefined;
            });
        });

        context('when getting existing delegate', () => {

            const rawDelegate = { account: getNewAccount(), username: getNewDelegateName() };

            before(() => {
                DelegateRepo.add(rawDelegate.account, { username: rawDelegate.username });
            });

            it('should return delegate', () => {
                let response = DelegateRepo.getByPublicKey(rawDelegate.account.publicKey);
                expect(response).to.be.instanceOf(Delegate);
                expect(response.username).to.be.eql(rawDelegate.username);
                response = DelegateRepo.getByPublicKey('123');
                expect(response).to.be.undefined;
            });

            after(() => {
                DelegateRepo.delete(rawDelegate.account);
            });
        });
    });

    describe('function \'isUserNameExists\'', () => {

        context('when checking delegate\'s name', () => {

            const rawDelegate1 = { account: getNewAccount(), username: getNewDelegateName() };
            const rawDelegate2 = { account: getNewAccount(), username: getNewDelegateName() };

            before(() => {
                DelegateRepo.add(rawDelegate1.account, { username: rawDelegate1.username });
                DelegateRepo.add(rawDelegate2.account, { username: rawDelegate2.username });
            });

            it('should return false if name doesn\'t exist', () => {
                let response = DelegateRepo.isUserNameExists('username');
                expect(response).to.be.false;
            });

            it('should return true if name exists', () => {
                let response = DelegateRepo.isUserNameExists(rawDelegate1.username);
                expect(response).to.be.true;
                response = DelegateRepo.isUserNameExists(rawDelegate2.username);
                expect(response).to.be.true;
            });

            after(() => {
                DelegateRepo.delete(rawDelegate1.account);
                DelegateRepo.delete(rawDelegate2.account);
            });
        });
    });
});
