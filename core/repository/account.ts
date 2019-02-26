import { Account, AccountModel, Address } from 'shared/model/account';
import Response from 'shared/model/response';
import {Delegate} from 'shared/model/delegate';

class AccountRepo {
    private memoryAccountsByAddress: { [address: number]: Account } = {};
    private memoryAccountsByPublicKey: { [publicKey: string]: Account } = {};

    public add(account: AccountModel): Response<Account> {
        const accountModel = new Account(account);
        this.memoryAccountsByAddress[account.address] = accountModel;
        this.memoryAccountsByPublicKey[account.publicKey] = accountModel;
        return new Response<Account>({ data: accountModel });
    }

    getByAddress(accountAddress: number): Account {
        return this.memoryAccountsByAddress[accountAddress].getCopy() || null;
    }

    getByPublicKey(accountPublicKey: string): Account {
        return this.memoryAccountsByPublicKey[accountPublicKey].getCopy() || null;
    }

    // should be called rarely
    getAll(): Array<Account> {
        return Object.values(this.memoryAccountsByAddress).map((account: Account) => {
            return account.getCopy();
        });
    }

    delete(account: Account): Response<void> {
        delete(this.memoryAccountsByAddress[account.address]);
        delete(this.memoryAccountsByPublicKey[account.publicKey]);
        return new Response<void>();
    }

    // example: such functions should be handlers and depends on workflows
    updateBalance(account: Account, balance: number): Response<void> {
        this.memoryAccountsByPublicKey[account.publicKey].actualBalance = balance;
        return new Response<void>();
    }

    updateBalanceByPublicKey(publicKey: string, difference: number): Response<void> {
        this.memoryAccountsByPublicKey[publicKey].actualBalance += difference;
        return new Response<void>();
    }

    updateBalanceByAddress(address: Address, difference: number): Response<void> {
        this.memoryAccountsByAddress[address].actualBalance += difference;
        return new Response<void>();
    }

    attachDelegate(account: Account, delegate: Delegate): Response<void> {
        this.memoryAccountsByAddress[account.address].delegate = delegate;
        return new Response<void>();
    }

    updateVotes(account: Account, votes: Array<string> ): Response<void> {
        this.memoryAccountsByAddress[account.address].votes = votes;
        return new Response<void>();
    }

    updateReferralByAddress(address: Address, referrals: Array<Account>): Response<void> {
        this.memoryAccountsByAddress[address].referrals = referrals;
        return new Response<void>();
    }
}

export default new AccountRepo();
