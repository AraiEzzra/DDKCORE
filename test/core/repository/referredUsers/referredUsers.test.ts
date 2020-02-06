import { expect } from 'chai';
import ReferredUsersTree from 'core/repository/referredUsers/tree/AirdropReferredUsersTree';
import AirdropHistoryRepository from 'core/repository/airdropHistory/AirdropHistoryRepository';
import {
    getNewAccount
} from 'test/core/repository/account/mock';
import { Transaction } from 'shared/model/transaction';

const referredUsersTreeRepo = new ReferredUsersTree(new AirdropHistoryRepository());

describe('ReferredUsers repository', () => {

    describe('function \'getUsers\'', () => {

        it('unknown account', () => {

            const account = getNewAccount();

            expect(referredUsersTreeRepo.getUsers(account, 1)).to.deep.equal([]);
        });

        context('add one account', () => {

            const account = getNewAccount();

            before(() => {
                referredUsersTreeRepo.add(account);
            });

            it('return added node', () => {
                expect(referredUsersTreeRepo.getUsers(account, 1)).to.deep.equal([]);
            });

            after(() => {
                referredUsersTreeRepo.delete(account);
            });
        });

        context('root->account', () => {

            const root = getNewAccount();
            const account = getNewAccount();

            account.referrals = [
                root
            ];

            before(() => {
                referredUsersTreeRepo.add(root);

                referredUsersTreeRepo.add(account);
                referredUsersTreeRepo.updateCountFactor(new Transaction({
                    'senderAddress': account.address,
                    'type': 0,
                    'asset': {
                        'referral': root.address
                    },
                    'id': '7db638aada1d50b87a09229bedcd9381597f76ac18fe63df695eb57961761540'
                }));
            });

            it('root level 1', () => {
                expect(referredUsersTreeRepo.getUsers(root, 1)).to.deep.equal([
                    {
                        address: account.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 2', () => {
                expect(referredUsersTreeRepo.getUsers(root, 2)).to.deep.equal([
                    {
                        address: account.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 3', () => {
                expect(referredUsersTreeRepo.getUsers(root, 3)).to.deep.equal([
                    {
                        address: account.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 4', () => {
                expect(referredUsersTreeRepo.getUsers(root, 4)).to.deep.equal([]);
            });

            it('account level 1', () => {
                expect(referredUsersTreeRepo.getUsers(account, 1)).to.deep.equal([]);
            });

            it('account level 2', () => {
                expect(referredUsersTreeRepo.getUsers(account, 2)).to.deep.equal([]);
            });

            it('account level 3', () => {
                expect(referredUsersTreeRepo.getUsers(account, 3)).to.deep.equal([]);
            });

            it('account level 4', () => {
                expect(referredUsersTreeRepo.getUsers(account, 4)).to.deep.equal([]);
            });

            after(() => {
                referredUsersTreeRepo.delete(root);
                referredUsersTreeRepo.delete(account);
            });
        });

        context('root->(account1, account2)', () => {

            const root = getNewAccount();

            const account1 = getNewAccount();

            account1.referrals = [
                root
            ];

            const account2 = getNewAccount();

            account2.referrals = [
                root
            ];

            before(() => {
                referredUsersTreeRepo.add(root);

                referredUsersTreeRepo.add(account1);
                referredUsersTreeRepo.updateCountFactor(new Transaction({
                    'senderAddress': account1.address,
                    'type': 0,
                    'asset': {
                        'referral': root.address
                    },
                    'id': '7db638aada1d50b87a09229bedcd9381597f76ac18fe63df695eb57961761540'
                }));

                referredUsersTreeRepo.add(account2);
                referredUsersTreeRepo.updateCountFactor(new Transaction({
                    'senderAddress': account2.address,
                    'type': 0,
                    'asset': {
                        'referral': root.address
                    },
                    'id': '7db638aada1d50b87a09229bedcd9381597f76ac18fe63df695eb57961761540'
                }));
            });

            it('root level 1', () => {
                expect(referredUsersTreeRepo.getUsers(root, 1)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    },
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 2', () => {
                expect(referredUsersTreeRepo.getUsers(root, 2)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    },
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 3', () => {
                expect(referredUsersTreeRepo.getUsers(root, 3)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    },
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 4', () => {
                expect(referredUsersTreeRepo.getUsers(root, 4)).to.deep.equal([]);
            });

            it('account1 level 1', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 1)).to.deep.equal([]);
            });

            it('account1 level 2', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 2)).to.deep.equal([]);
            });

            it('account1 level 3', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 3)).to.deep.equal([]);
            });

            it('account1 level 4', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 4)).to.deep.equal([]);
            });

            it('account2 level 1', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 1)).to.deep.equal([]);
            });

            it('account2 level 2', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 2)).to.deep.equal([]);
            });

            it('account2 level 3', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 3)).to.deep.equal([]);
            });

            it('account2 level 4', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 4)).to.deep.equal([]);
            });

            after(() => {
                referredUsersTreeRepo.delete(root);
                referredUsersTreeRepo.delete(account1);
                referredUsersTreeRepo.delete(account2);
            });
        });

        context('root->account1->account2', () => {

            const root = getNewAccount();

            const account1 = getNewAccount();

            account1.referrals = [
                root
            ];

            const account2 = getNewAccount();

            account2.referrals = [
                account1,
                root
            ];

            before(() => {
                referredUsersTreeRepo.add(root);

                referredUsersTreeRepo.add(account1);
                referredUsersTreeRepo.updateCountFactor(new Transaction({
                    'senderAddress': account1.address,
                    'type': 0,
                    'asset': {
                        'referral': root.address
                    },
                    'id': '7db638aada1d50b87a09229bedcd9381597f76ac18fe63df695eb57961761540'
                }));

                referredUsersTreeRepo.add(account2);
                referredUsersTreeRepo.updateCountFactor(new Transaction({
                    'senderAddress': account2.address,
                    'type': 0,
                    'asset': {
                        'referral': account1.address
                    },
                    'id': '7db638aada1d50b87a09229bedcd9381597f76ac18fe63df695eb57961761546'
                }));
            });

            it('root level 1', () => {
                expect(referredUsersTreeRepo.getUsers(root, 1)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: false,
                        factors: {
                            items: [1, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 2', () => {
                expect(referredUsersTreeRepo.getUsers(root, 2)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: false,
                        factors: {
                            items: [1, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 3', () => {
                expect(referredUsersTreeRepo.getUsers(root, 3)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('root level 4', () => {
                expect(referredUsersTreeRepo.getUsers(root, 4)).to.deep.equal([]);
            });

            it('account1 level 1', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 1)).to.deep.equal([
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('account1 level 2', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 2)).to.deep.equal([
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('account1 level 3', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 3)).to.deep.equal([
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: {
                            items: [0, 0, 0]
                        }
                    }
                ]);
            });

            it('account1 level 4', () => {
                expect(referredUsersTreeRepo.getUsers(account1, 4)).to.deep.equal([]);
            });

            it('account2 level 1', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 1)).to.deep.equal([]);
            });

            it('account2 level 2', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 2)).to.deep.equal([]);
            });

            it('account2 level 3', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 3)).to.deep.equal([]);
            });

            it('account2 level 4', () => {
                expect(referredUsersTreeRepo.getUsers(account2, 4)).to.deep.equal([]);
            });

            after(() => {
                referredUsersTreeRepo.delete(root);
                referredUsersTreeRepo.delete(account1);
                referredUsersTreeRepo.delete(account2);
            });
        });

    });

});
