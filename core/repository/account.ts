import {Account, Address, PublicKey} from 'shared/model/account';
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

    delete(account: Account): void {
        this.memoryAccountsByAddress.delete(account.address);
    }

    // example: such functions should be handlers and depends on workflows
    updateBalance(account: Account, balance: number): void {
        this.memoryAccountsByAddress.get(account.address).actualBalance = balance;
    }

    updateBalanceByAddress(address: Address, difference: number): void {
        this.memoryAccountsByAddress.get(address).actualBalance += difference;
    }

    updateVotes(account: Account, votes: Array<string> ): void {
        this.memoryAccountsByAddress.get(account.address).votes = votes;
    }

    updateReferralByAddress(address: Address, referrals: Array<Account>): void {
        this.memoryAccountsByAddress.get(address).referrals = referrals;
    }
}

export default new AccountRepo();
