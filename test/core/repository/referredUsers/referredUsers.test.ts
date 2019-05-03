import { expect } from 'chai';
import ReferredUserRepo from 'core/repository/referredUsers';
import { FactorType } from 'core/repository/referredUsers/interfaces';
import {
    getNewAccount
} from 'test/core/repository/account/mock';

describe('ReferredUsers repository', () => {

    describe('function \'getUsers\'', () => {

        it('unknown account', () => {

            const account = getNewAccount();

            expect(ReferredUserRepo.getUsers(account, 0)).to.deep.equal([]);
        });

        context('add one account', () => {

            const account = getNewAccount();

            before(() => {
                ReferredUserRepo.add(account);
            })

            it('return added node', () => {
                expect(ReferredUserRepo.getUsers(account, 0)).to.deep.equal([]);
            });

            after(() => {
                ReferredUserRepo.delete(account);
            });
        });

        context('add one account with referrals', () => {

            const referral = getNewAccount();
            const account = getNewAccount();

            account.referrals = [
                referral
            ];

            before(() => {
                ReferredUserRepo.add(referral);
                ReferredUserRepo.add(account);
            })

            it('return added node with children', () => {

                expect(ReferredUserRepo.getUsers(account, 0)).to.deep.equal([]);

                expect(ReferredUserRepo.getUsers(referral, 0)).to.deep.equal([
                    {
                        address: account.address,
                        isEmpty: true,
                        factors: new Map([
                            [FactorType.COUNT, 0],
                            [FactorType.REWARD, 0],
                            [FactorType.STAKE_AMOUNT, 0]
                        ])
                    }
                ]);

            });

            after(() => {
                ReferredUserRepo.delete(referral);
                ReferredUserRepo.delete(account);
            });
        });

        context('level 0 one child', () => {

            const referral = getNewAccount();
            const account = getNewAccount();

            account.referrals = [
                referral
            ];

            before(() => {
                ReferredUserRepo.add(referral);
                ReferredUserRepo.add(account);
            })

            it('one referred User', () => {

                expect(ReferredUserRepo.getUsers(referral, 0)).to.deep.equal([
                    {
                        address: account.address,
                        isEmpty: true,
                        factors: new Map([
                            [FactorType.COUNT, 0],
                            [FactorType.REWARD, 0],
                            [FactorType.STAKE_AMOUNT, 0]
                        ])
                    }
                ]);
            });

            after(() => {
                ReferredUserRepo.delete(referral);
                ReferredUserRepo.delete(account);
            });
        });


        context('level 0 two child', () => {

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
                ReferredUserRepo.add(root);
                ReferredUserRepo.add(account1);
                ReferredUserRepo.add(account2);
            })

            it('one referred User', () => {

                expect(ReferredUserRepo.getUsers(root, 0)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: true,
                        factors: new Map([
                            [FactorType.COUNT, 0],
                            [FactorType.REWARD, 0],
                            [FactorType.STAKE_AMOUNT, 0]
                        ])
                    },
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: new Map([
                            [FactorType.COUNT, 0],
                            [FactorType.REWARD, 0],
                            [FactorType.STAKE_AMOUNT, 0]
                        ])
                    }
                ]);
            });

            after(() => {
                ReferredUserRepo.delete(root);
                ReferredUserRepo.delete(account1);
                ReferredUserRepo.delete(account2);
            });
        });

        context('level 0 two child', () => {

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
                ReferredUserRepo.add(root);
                ReferredUserRepo.add(account1);
                ReferredUserRepo.add(account2);
            });

            it('one referred User', () => {

                expect(ReferredUserRepo.getUsers(root, 0)).to.deep.equal([
                    {
                        address: account1.address,
                        isEmpty: false,
                        factors: new Map([
                            [FactorType.COUNT, 1],
                            [FactorType.REWARD, 0],
                            [FactorType.STAKE_AMOUNT, 0]
                        ])
                    }
                ]);

                expect(ReferredUserRepo.getUsers(account1, 0)).to.deep.equal([
                    {
                        address: account2.address,
                        isEmpty: true,
                        factors: new Map([
                            [FactorType.COUNT, 0],
                            [FactorType.REWARD, 0],
                            [FactorType.STAKE_AMOUNT, 0]
                        ])
                    }
                ]);

            });

            after(() => {
                ReferredUserRepo.delete(root);
                ReferredUserRepo.delete(account1);
                ReferredUserRepo.delete(account2);
            });
        });

    })

});
