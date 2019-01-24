import { Account } from 'shared/model/account';
import { AuthorizedAccount } from 'shared/model/authorizedAccount';
import { AccountRepository } from 'shared/repository/account';
import { AccountPGQLRepository } from 'shared/repository/account';

export type IPubkey = {
    publicKey: string;
}

export type IAddress = {
    address: string;
}

export class Response<T> {
    success: boolean;
    errors?: Array<string>;
    data?: T;

    constructor(data?: T, errors?: Array<string>) {
        this.success = Boolean(errors.length);
        this.errors = errors || [];
        this.data = data;
    }
}

declare class AccountDTO {
    username: string;
    unconfirmedBalance: string;
    balance: string;
    publicKey: string;
    unconfirmedSignature: any;
    secondSignature: any;
    secondPublicKey: any;
    multisignatures: any;
    u_multisignatures: any;
    totalFrozeAmount: string;
    groupBonus: string;
    token: string;
}

export interface AccountService {

    // instead of /open method in backlog
    login(): AuthorizedAccount;

    register(): void;

    // instead of getAccount(filter) in backlog
    getAccountByAddress(address: string): Response<Account>;

    getAccountByPublicKey(publicKey: string): Account;

    saveAccountAndGet(params: IPubkey | IAddress): Account;

    getTotalAccounts(): number;

    checkAddressExists(refferalAddress: string): boolean;

    getAccountsBalance(address: string): number;

    getAccountsPublicKey(address: string): number;

    generatePublicKey(secret: string): string;



}

export class AccountServiceImpl implements AccountService {

    private static instance: AccountServiceImpl = undefined;
    private accountRepository: AccountRepository;

    constructor() {
        if(!AccountServiceImpl.instance) {
            AccountServiceImpl.instance = this;
            this.accountRepository = new AccountPGQLRepository();
        }
        return AccountServiceImpl.instance;
    }

    checkAddressExists(refferalAddress: string): boolean {
        return false;
    }

    createAccount(secret: string): Account {
        return undefined;
    }

    generatePublicKey(secret: string): string {
        return "";
    }

    getAccountByAddress(address: string): Response<Account> {
        return undefined;
    }

    getAccountByPublicKey(publicKey: string): Account {
        return undefined;
    }

    getAccountsBalance(address: string): number {
        return 0;
    }

    getAccountsPublicKey(address: string): number {
        return 0;
    }

    getTotalAccounts(): number {
        return 0;
    }

    login(): Account {
        return undefined;
    }

    saveAccountAndGet(params: IPubkey | IAddress): Account {
        return undefined;
    }


}
