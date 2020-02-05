import { expect } from 'chai';
import AirdropHistoryRepository from 'core/repository/airdropHistory/AirdropHistoryRepository';
import SlotService from 'core/service/slot';

const airdropHistoryRepository = new AirdropHistoryRepository();

describe('AirdropHistoryRepository', () => {

    describe('getHistory', () => {

        beforeEach(() => {
            airdropHistoryRepository.clear();
        });

        it('add one item', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432294,
                sponsorAddress: BigInt('16682393721145110171'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: 40
            };

            airdropHistoryRepository.add(item1);

            const history = airdropHistoryRepository.getHistory({
                referralAddress: BigInt('12562513182843957946'),
                startTime: SlotService.getRealTime(85432294 - 1),
                endTime: SlotService.getRealTime(85432294 + 1),
            });

            expect(history).to.deep.equal([item1]);
        });

        it('add two item', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432294,
                sponsorAddress: BigInt('16682393721145110171'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: 40
            };

            const item2 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432295,
                sponsorAddress: BigInt('16682393721145110171'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e532',
                transactionType: 40
            };

            airdropHistoryRepository.add(item1);
            airdropHistoryRepository.add(item2);

            const history = airdropHistoryRepository.getHistory({
                referralAddress: BigInt('12562513182843957946'),
                startTime: SlotService.getRealTime(85432294 - 1),
                endTime: SlotService.getRealTime(85432294)
            });

            expect(history).to.deep.equal([item1]);
        });

    });

    describe('getDailyHistory', () => {

        beforeEach(() => {
            airdropHistoryRepository.clear();
        });

        it('add one item', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432294,
                sponsorAddress: BigInt('16682393721145110171'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: 40
            };

            airdropHistoryRepository.add(item1);

            const history = airdropHistoryRepository.getDailyHistory({
                referralAddress: BigInt('12562513182843957946')
            });

            expect(history).to.deep.equal([
                {
                    rewardAmount: 10000000,
                    rewardTime: 1537056000000,
                    usersCount: 1
                }
            ]);
        });

        it('add two item in one day', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432294,
                sponsorAddress: BigInt('16682393721145110171'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: 40
            };

            const item2 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432294,
                sponsorAddress: BigInt('16682393721145110172'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e532',
                transactionType: 40
            };

            airdropHistoryRepository.add(item1);
            airdropHistoryRepository.add(item2);

            const history = airdropHistoryRepository.getDailyHistory({
                referralAddress: BigInt('12562513182843957946')
            });

            expect(history).to.deep.equal([
                {
                    rewardAmount: 20000000,
                    rewardTime: 1537056000000,
                    usersCount: 2
                }
            ]);
        });

        it('add two item in different days', () => {
            const item1 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85432294,
                sponsorAddress: BigInt('16682393721145110171'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e537',
                transactionType: 40
            };

            const item2 = {
                referralAddress: BigInt('12562513182843957946'),
                rewardAmount: 10000000,
                rewardTime: 85637000,
                sponsorAddress: BigInt('16682393721145110172'),
                sponsorLevel: 1,
                transactionId: '0a07fd7bd116b8d9546a9469309ea1cdf5d862efec2452904a68ea9654e7e532',
                transactionType: 40
            };

            airdropHistoryRepository.add(item1);
            airdropHistoryRepository.add(item2);

            const history = airdropHistoryRepository.getDailyHistory({
                referralAddress: BigInt('12562513182843957946')
            });

            expect(history).to.deep.equal([
                {
                    rewardAmount: 10000000,
                    rewardTime: 1537056000000,
                    usersCount: 1
                },
                {
                    rewardAmount: 10000000,
                    rewardTime: 1537228800000,
                    usersCount: 1
                }
            ]);
        });
    });
});
