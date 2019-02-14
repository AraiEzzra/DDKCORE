import { Delegate } from 'shared/model/delegate';

export type Address = number;
export type PublicKey = string;
export type Timestamp = number;

type AirdropReward = {
    [address: string]: number;
}

class Stake {
    createdAt: Timestamp;
    isActive: boolean;
    amount: number;
    voteCount: number;
    nextVoteMilestone: Timestamp;

    // TODO: for sendStake
    transferCount?: number;
    airdropReward: AirdropReward;
}

export class Account {

    address: Address;
    publicKey: PublicKey;
    secondPublicKey: PublicKey;
    actualBalance: number;

    delegate: Delegate;
    votes: Array<PublicKey>;
    referrals: Array<Account>;
    stakes: Array<Stake>;

    // TODO: define what is that sh*t
    // group_bonus: number;
    // pending_group_bonus: number;
}
