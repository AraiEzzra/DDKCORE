import { Delegate } from 'shared/model/delegate';
import { AccountState } from 'shared/model/types';

export type Address = BigInt;
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
    sourceTransactionId: string;

    constructor(data: Stake) {
        Object.assign(this, data);
    }
}

export class AccountModel {
    address: Address;
    publicKey?: PublicKey;
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
        this.stakes = (data.stakes || []).map(stake => ({ ...stake }));
        this.delegate = data.delegate && new Delegate(data.delegate);
    }
}

export class Account extends AccountModel {
    
    history: Array<AccountState> = [];

    public getCopy(): Account {
        return new Account( { ...this, history: [] });
    }
    
    historify(): AccountState {
        const account = this.getCopy();
        // TODO can be optimized if we will store only changed accounts
        this.history.push(account);
        return account;
    }
}
