import { Account} from 'shared/model/account';
import { PublicKey } from 'shared/model/types';

// todo interface for example delegate model for delegatesRepository. Discuss it
export class DelegateModel {
    username: string;
    url?: string = '';
    missedBlocks?: number;
    forgedBlocks?: number;
    account?: Account;
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

export type SerializedDelegate = {
    username: string;
    missedBlocks: number;
    forgedBlocks: number;
    publicKey: PublicKey;
    votes: number;
};
