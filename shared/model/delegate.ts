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

export class Delegate implements IDelegate{
    username: string;
    url: string;
    missedBlocks: number;
    forgedBlocks: number;
    account: Account;
    votes: number;
    
    constructor(data: IDelegate) {
        Object.assign(this, data);
    }
    // index Array of delegate`s Accounts
}
