import { Account, IAccountFilds } from 'shared/model/account';
import Response from 'shared/model/response';

class AccountRepo {
    private memoryAccountsByAddress: { [address: number]: Account } = {};
    private memoryAccountsByPublicKey: { [publicKey: string]: Account } = {};

    public addAccount(account: IAccountFilds): Response<void> {
        const accountModel = new Account(account);
        this.memoryAccountsByAddress[account.address] = accountModel;
        this.memoryAccountsByPublicKey[account.publicKey] = accountModel;
        return new Response<void>();
    }

    getAccountByAddress(accountAddress: number): Account {
        return this.memoryAccountsByAddress[accountAddress].getCopy() || null;
    }

    getAccountByPublicKey(accountPublicKey: string): Account {
        return this.memoryAccountsByPublicKey[accountPublicKey].getCopy() || null;
    }

    // should be called rarely
    getAllAccounts(): Array<Account> {
        return Object.values(this.memoryAccountsByAddress).map((account: Account) => {
            return account.getCopy();
        });
    }

    deleteAccount(account: Account): Response<void> {
        delete(this.memoryAccountsByAddress[account.address]);
        delete(this.memoryAccountsByPublicKey[account.publicKey]);
        return new Response<void>();
    }

    // example: such functions should be handlers and depends on workflows
    updateAccountBalance(account: Account, balance: number): Response<void> {
        this.memoryAccountsByPublicKey[account.publicKey].actualBalance = balance;
        this.memoryAccountsByAddress[account.address].actualBalance = balance;
        return new Response<void>();
    }
}

export default new AccountRepo();
