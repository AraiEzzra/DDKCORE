import { TransactionType } from 'shared/model/transaction';
import { Address} from 'shared/model/types';
import { Timestamp } from 'shared/model/types';

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
    createdAt: Timestamp;
    amount: number;

    constructor(data: StakeReward) {
        Object.assign(this, data);
    }
}
