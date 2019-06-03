import { expect } from 'chai';
import AirdropHistoryStorage from 'core/repository/airdropHistory/AirdropHistoryStorage';
import { TransactionType } from 'shared/model/transaction';

const airdropHistoryStorage = new AirdropHistoryStorage();

describe('AirdropHistoryStorage', () => {

    describe('add', () => {

        beforeEach(() => {
            airdropHistoryStorage.clear();
        });

        it('empty', () => {
            expect([...airdropHistoryStorage]).to.deep.equal([]);
        });

        it('add one item', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                sponsorAddress: BigInt('12562513182843957946'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: TransactionType.VOTE,
                rewardAmount: 1000,
                rewardTime: 0
            };

            airdropHistoryStorage.add(item1);

            expect([...airdropHistoryStorage]).to.deep.equal([item1]);
        });
    });

    describe('remove', () => {

        beforeEach(() => {
            airdropHistoryStorage.clear();
        });

        it('remove one item', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                sponsorAddress: BigInt('12562513182843957946'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: TransactionType.VOTE,
                rewardAmount: 1000,
                rewardTime: 0
            };

            airdropHistoryStorage.add(item1);
            airdropHistoryStorage.remove(item1);

            expect([...airdropHistoryStorage]).to.deep.equal([]);
        });
    });

    describe('find', () => {

        beforeEach(() => {
            airdropHistoryStorage.clear();
        });

        it('find one item', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                sponsorAddress: BigInt('12562513182843957946'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: TransactionType.VOTE,
                rewardAmount: 1000,
                rewardTime: 0
            };

            airdropHistoryStorage.add(item1);

            expect(airdropHistoryStorage.find({rewardTime: {$gte: 0}})).to.deep.equal([item1]);
        });
    });
});
