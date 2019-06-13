import { Address, TransactionId, Timestamp } from 'shared/model/types';
import { TransactionType } from 'shared/model/transaction';

export interface IAirdropHistoryRepository {
    add(data: AirdropHistory);
    remove(data: AirdropHistory);
    clear(): void;
    getDailyHistory(query: AirdropDailyHistoryQuery): ReadonlyArray<AirdropDailyHistory>;
    getHistory(query: AirdropHistoryQuery): ReadonlyArray<AirdropHistory>;
}

export type AirdropHistoryQuery = {
    referralAddress: Address;
    startTime: Timestamp;
    endTime: Timestamp;
};

export type AirdropHistory = {
    referralAddress: Address;
    sponsorAddress: Address;
    sponsorLevel: number;
    transactionId: TransactionId;
    transactionType: TransactionType;
    rewardAmount: number;
    rewardTime: number;
};

export type AirdropDailyHistoryQuery = {
    referralAddress: Address;
};

export type AirdropDailyHistory = {
    rewardAmount: number;
    rewardTime: number;
    usersCount: number;
};
