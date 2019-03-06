import { Account, Address, PublicKey } from 'shared/model/account';
import Response from 'shared/model/response';
import { Delegate } from 'shared/model/delegate';
import { getAddressByPublicKey } from 'shared/util/account';

class AccountRepo {
    private memoryAccountsByAddress: { [address: number]: Account } = {};

    public add(accountData: { address: Address, publicKey: PublicKey }): Account {
        const accountModel = new Account(accountData);
        this.memoryAccountsByAddress[accountData.address] = accountModel;
        return accountModel;
    }

    getByAddress(accountAddress: number): Account {
        return this.memoryAccountsByAddress[accountAddress] || null;
    }

    /** TODO refactor to getByAddress */
    getByPublicKey(accountPublicKey: string): Account {
        return this.memoryAccountsByAddress[getAddressByPublicKey(accountPublicKey)] || null;
    }

    // should be called rarely
    getAll(): Array<Account> {
        return Object.values(this.memoryAccountsByAddress).map((account: Account) => {
            return account.getCopy();
        });
    }

    delete(account: Account): Response<void> {
        delete(this.memoryAccountsByAddress[account.address]);
        return new Response<void>();
    }

    // example: such functions should be handlers and depends on workflows
    updateBalance(account: Account, balance: number): void {
        this.memoryAccountsByAddress[account.address].actualBalance = balance;
    }

    /** TODO refactor to getByAddress */
    updateBalanceByPublicKey(publicKey: PublicKey, difference: number): void {
        this.memoryAccountsByAddress[getAddressByPublicKey(publicKey)].actualBalance += difference;
    }

    updateBalanceByAddress(address: Address, difference: number): void {
        this.memoryAccountsByAddress[address].actualBalance += difference;
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
