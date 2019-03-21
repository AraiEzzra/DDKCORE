import {Account, Address, PublicKey} from 'shared/model/account';
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
    updateBalance(account: Account, balance: number): boolean {
        const memoryAccount = this.memoryAccountsByAddress.get(account.address);
        if (!memoryAccount) {
            return false;
        }
        memoryAccount.actualBalance = balance;
        return true;
    }

    updateBalanceByAddress(address: Address, difference: number): boolean {
        const memoryAccount = this.memoryAccountsByAddress.get(address);
        if (!memoryAccount) {
            return false;
        }
        memoryAccount.actualBalance += difference;
        return true;
    }

    updateVotes(account: Account, votes: Array<string> ): boolean {
        const memoryAccount = this.memoryAccountsByAddress.get(account.address);
        if (!memoryAccount) {
            return false;
        }
        memoryAccount.votes = votes;
        return true;
    }

    updateReferralByAddress(address: Address, referrals: Array<Account>): boolean {
        const memoryAccount = this.memoryAccountsByAddress.get(address);
        if (!memoryAccount) {
            return false;
        }
        memoryAccount.referrals = referrals;
        return true;
    }
}

export default new AccountRepo();
