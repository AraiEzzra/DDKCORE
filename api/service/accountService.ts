import { Account } from 'shared/model/account';

export type IPubkey = {
    publicKey: string;
}

export type IAddress = {
    address: string;
}

export interface AccountService {
    // instead of getAccount(filter)
    getAccountByAddress(address: string): Account;
    saveAccount(params: IPubkey | IAddress): Account;
    saveAccountAndGet(params: IPubkey | IAddress): Account;
    getTotalAccounts(): number;
}
