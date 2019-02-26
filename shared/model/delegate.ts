import { Account } from 'shared/model/account';

// todo interface for example delegate model for delegatesRepository. Discuss it
export class DelegateModel {
    username: string;
    url?: string;
    missedBlocks?: number;
    forgedBlocks?: number;
    account: Account;
    votes?: number;

    constructor(data: DelegateModel) {
        Object.assign(this, data);
    }
}

export class Delegate extends DelegateModel {

    getCopy(): Delegate {
        return new Delegate(this);
    }
    // index Array of delegate`s Accounts
}
