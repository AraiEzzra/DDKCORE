import { GetAccountParams, RegistrationParams } from 'api/util/types/account';
import { Account } from 'shared/model/account';
import { AuthorizedAccount } from 'shared/model/authorizedAccount';
import ResponseEntity from 'shared/model/response';
import { AccountPGQLRepository, AccountRepository } from 'shared/repository/account';


export interface AccountService {

    // instead of /open method in backlog
    login(secret: string): AuthorizedAccount;

    register(params: RegistrationParams): boolean;

    getBalance(address: string): ResponseEntity<string>;

    getPublicKey(address: string): ResponseEntity<string>;

    generatePublicKey(secret: string): ResponseEntity<string>;

    getAccount(params: GetAccountParams): ResponseEntity<Account>;

    getTotalAccounts(): ResponseEntity<number>;

    getCirculatingSupply(): ResponseEntity<number>;

    checkAccountsExistence(address: string): ResponseEntity<boolean>;

}

export class AccountServiceImpl implements AccountService {

    private accountRepository: AccountRepository;

    constructor() {
        this.accountRepository = new AccountPGQLRepository();
    }

    checkAccountsExistence(address: string): ResponseEntity<boolean> {
        return undefined;
    }

    generatePublicKey(secret: string): ResponseEntity<string> {
        return undefined;
    }

    getAccount(params: GetAccountParams): ResponseEntity<Account> {
        return undefined;
    }

    getBalance(address: string): ResponseEntity<string> {
        return undefined;
    }

    getCirculatingSupply(): ResponseEntity<number> {
        return undefined;
    }

    getPublicKey(address: string): ResponseEntity<string> {
        return undefined;
    }

    getTotalAccounts(): ResponseEntity<number> {
        return undefined;
    }

    login(secret: string): AuthorizedAccount {
        return undefined;
    }

    register(params: RegistrationParams): boolean {
        return false;
    }

}
