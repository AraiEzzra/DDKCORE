import { TransactionType } from 'shared/model/transaction';
import { Address, Timestamp } from 'shared/model/account';

export class Reward {
    transactionId: string;
    type: TransactionType;
    createdAt: Timestamp;
    sponsor: Address;
    referral: Address;
    referralLevel?: number;
    amount: number;

    constructor(data: Reward) {
        Object.assign(this, data);
    }
}

export class StakeReward {
    transactionId: string;
    createdAt: Timestamp;
    referralRewards: Array<{ referral: string, amount: number }>;
    amount: number;

    constructor(data: StakeReward) {
        Object.assign(this, data);
    }
}
