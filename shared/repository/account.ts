import { Account } from 'shared/model/account';

export interface AccountRepository {

    getAccountByAddress(address: string): Promise<Account>;

    getAccountByPublicKey(publicKey: string): Promise<Account>;

    getCountAccounts(): Promise<number>;

    getBalanceByAddress(address: string): Promise<number>;

    getCountAccountByAddress(address: string): Promise<number>;

}

export class AccountPGQLRepository implements AccountRepository {

    getAccountByAddress(address: string): Promise<Account> {
        return undefined;
    }

    getAccountByPublicKey(publicKey: string): Promise<Account> {
        return undefined;
    }

    getBalanceByAddress(address: string): Promise<number> {
        return undefined;
    }

    getCountAccountByAddress(address: string): Promise<number> {
        return undefined;
    }

    getCountAccounts(): Promise<number> {
        return undefined;
    }


}
