import { generateAccounts } from 'api/mock/account';
import { AccountModel, Address } from 'shared/model/account';
import ResponseEntity from 'shared/model/response';

export interface AccountService {

    getAccountByAddress(address: Address): ResponseEntity<AccountModel>;

    getAccountByPublicKey(publicKey: string): ResponseEntity<AccountModel>;

}

export class AccountServiceImpl implements AccountService {

    private accounts: Array<AccountModel>; // mock for wallet

    constructor() {
        this.accounts = generateAccounts();
    }

    getAccountByAddress(address: Address): ResponseEntity<AccountModel> {
        const account = this.accounts.find((account: any) => account.address == address);
        return new ResponseEntity({ data: account });
    }

    getAccountByPublicKey(publicKey: string): ResponseEntity<AccountModel> {
        const account = this.accounts.find((account: AccountModel) => account.publicKey == publicKey);
        return new ResponseEntity({ data: account });
    }
}

export default new AccountServiceImpl();
