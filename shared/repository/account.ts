import { Account } from 'shared/model/account';

export interface AccountRepository {
    
    // TODO: define data. Need to debug 
    createAccount(data: object): Account;
    getAccount(): Account;
    updateAccount(data: object): Account;
}
