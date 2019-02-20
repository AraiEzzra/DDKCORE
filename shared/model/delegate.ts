import { Account } from 'shared/model/account';

// todo interface for example delegate model for delegatesRepository. Discuss it
export interface IDelegate {
    username: string;
    url: string;
    missedBlocks: number;
    forgedBlocks: number;
    account: Account;
    votes: number;
}

export class Delegate {
    username: string;
    url: string;

    // index Array of delegate`s Accounts
}
