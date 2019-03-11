import {Account, Address, PublicKey} from 'shared/model/account';
import Response from 'shared/model/response';
import { Delegate } from 'shared/model/delegate';
import { getAddressByPublicKey } from 'shared/util/account';

class AccountRepo {
    private memoryAccountsByAddress: Map<Address, Account> = new Map<Address, Account>();

    public add(accountData: { address: Address, publicKey?: PublicKey }): Account {
        const accountModel = new Account(accountData);
        this.memoryAccountsByAddress.set(accountData.address, accountModel);
        return accountModel;
    }

    getByAddress(accountAddress: Address): Account {
        return this.memoryAccountsByAddress.get(accountAddress) || null;
    }

    /** TODO refactor to getByAddress */
    getByPublicKey(accountPublicKey: PublicKey): Account {
        const address = getAddressByPublicKey(accountPublicKey);
        return this.memoryAccountsByAddress.get(address) || null;
    }

    // should be called rarely
    getAll(): Array<Account> {
        const accounts: Array<Account> = [];
        for (let value of this.memoryAccountsByAddress.values()) {
            accounts.push(value);
        }
        return accounts;
    }

    delete(account: Account): Response<void> {
        this.memoryAccountsByAddress.delete(account.address);
        return new Response<void>();
    }

    // example: such functions should be handlers and depends on workflows
    updateBalance(account: Account, balance: number): void {
        this.memoryAccountsByAddress.get(account.address).actualBalance = balance;
    }

    /** TODO refactor to getByAddress */
    updateBalanceByPublicKey(publicKey: PublicKey, difference: number): void {
        this.memoryAccountsByAddress.get(getAddressByPublicKey(publicKey)).actualBalance += difference;
    }

    updateBalanceByAddress(address: Address, difference: number): void {
        this.memoryAccountsByAddress.get(address).actualBalance += difference;
    }

    attachDelegate(account: Account, delegate: Delegate): Response<void> {
        this.memoryAccountsByAddress.get(account.address).delegate = delegate;
        return new Response<void>();
    }

    updateVotes(account: Account, votes: Array<string> ): Response<void> {
        this.memoryAccountsByAddress.get(account.address).votes = votes;
        return new Response<void>();
    }

    updateReferralByAddress(address: Address, referrals: Array<Account>): Response<void> {
        this.memoryAccountsByAddress.get(address).referrals = referrals;
        return new Response<void>();
    }

    public updateSecondPublicKey = (address: Address, secondPublicKey: PublicKey) => {
        this.memoryAccountsByAddress.get(address).secondPublicKey = secondPublicKey;
    }
}

export default new AccountRepo();
