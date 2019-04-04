import { Account, Address, PublicKey } from 'shared/model/account';
import { getAddressByPublicKey } from 'shared/util/account';
import DelegateRepository from 'core/repository/delegate';

export type Statistics = {
    tokenHolders: number;
    totalStakeAmount: number;
    totalStakeHolders: number;
};

class AccountRepository {
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

    getStatistics(): Statistics {
        let tokenHolders = 0;
        let totalStakeAmount = 0;
        let totalStakeHolders = 0;
        for (const account of this.memoryAccountsByAddress.values()) {
            if (account.actualBalance > 0) {
                tokenHolders++;
            }

            const activeStakes = account.stakes.filter(stake => stake.isActive);

            if (activeStakes.length > 0) {
                totalStakeAmount += activeStakes.reduce((sum, stake) => sum += stake.amount, 0);
                totalStakeHolders += 1;
            }
        }
        return { tokenHolders, totalStakeAmount, totalStakeHolders };

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

    updateVotes(account: Account, votes: Array<string>): void {
        this.memoryAccountsByAddress.get(account.address).votes = votes;
    }

    updateReferralByAddress(address: Address, referrals: Array<Account>): void {
        this.memoryAccountsByAddress.get(address).referrals = referrals;
    }

    serialize(account: Account): object {
        return {
            address: account.address.toString(),
            isDelegate: Boolean(account.delegate),
            publicKey: account.publicKey,
            secondPublicKey: account.secondPublicKey,
            actualBalance: account.actualBalance,
            referrals: account.referrals.map(acc => acc.address.toString()),
            votes: account.votes.map(
                (publicKey: PublicKey) => DelegateRepository.serialize(DelegateRepository.getDelegate(publicKey))
            ).reverse(),
            stakes: account.stakes.reverse(),
        };
    }
}

export default new AccountRepository();
