import { Delegate } from 'shared/model/delegate';

export type Address = bigint;
export type PublicKey = string;
export type Timestamp = number;

type AirdropReward = Map<Address, number>;

export class Stake {
    createdAt: Timestamp;
    isActive: boolean;
    amount: number;
    voteCount: number;
    nextVoteMilestone: Timestamp;
    airdropReward: AirdropReward;
}

export class AccountModel {
    address: Address;
    publicKey: PublicKey;
    secondPublicKey?: PublicKey;
    actualBalance?: number = 0;
    delegate?: Delegate;
    votes?: Array<PublicKey>;
    referrals?: Array<Account>;
    stakes?: Array<Stake>;

    constructor(data: AccountModel) {
        Object.assign(this, data);
        this.votes = (data.votes || []).slice();
        this.referrals = (data.referrals || []).slice();
        this.stakes = (data.stakes || []).slice();
    }
}

export class Account extends AccountModel {

    public getCopy(): Account {
        return new Account(this);
    }

    // TODO: define what is that sh*t
    // group_bonus: number;
    // pending_group_bonus: number;
}
