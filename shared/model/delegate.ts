import { Account } from 'shared/model/account';
import { PublicKey } from 'shared/model/types';

// todo interface for example delegate model for delegatesRepository. Discuss it
export class DelegateModel {
    username: string;
    url: string;
    missedBlocks: number;
    forgedBlocks: number;
    account: Account;
    votes: number;
    confirmedVoteCount: number;
    approval: number;

    constructor(data: DelegateModel) {
        this.username = data.username;
        this.url = data.url;
        this.missedBlocks = data.missedBlocks;
        this.forgedBlocks = data.forgedBlocks;
        this.account = data.account;
        this.votes = data.votes;
        this.confirmedVoteCount = data.confirmedVoteCount;
        this.approval = data.approval || 0;
    }
}

export class Delegate extends DelegateModel {
    // index Array of delegate`s Accounts
}

export type SerializedDelegate = {
    username: string;
    missedBlocks: number;
    forgedBlocks: number;
    publicKey: PublicKey;
    votes: number;
    confirmedVoteCount: number;
    approval: number;
};
