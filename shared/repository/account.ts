import { Account } from 'shared/model/account';

export interface AccountRepository {

    // TODO: define data. Need to debug
    createAccount(data: object): Account;
    getAccount(): Account;
    updateAccount(data: object): Account;

}

export class AccountPGQLRepository implements AccountRepository {

    createAccount(data: object): Account {
        return undefined;
    }

    getAccount(): Account {
        return undefined;
    }

    updateAccount(data: object): Account {
        return undefined;
    }

}
