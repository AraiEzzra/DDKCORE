import { AccountRepository } from 'shared/repository/account';
import { AccountPGQLRepository } from 'shared/repository/accountImpl';
import { AccountService, IAddress, IPubkey } from 'api/service/accountService';
import { Account } from 'shared/model/account';

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
    
    getAccountByAddress(address: string): Account {
        return undefined;
    }

    getTotalAccounts(): number {
        return 0;
    }

    saveAccount(params: IPubkey | IAddress): Account {
        return undefined;
    }

    saveAccountAndGet(params: IPubkey | IAddress): Account {
        return undefined;
    }
    
}
