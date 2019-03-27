import { ResponseEntity } from 'shared/model/response';
import { Account, PublicKey } from 'shared/model/account';
import config from 'shared/config';
import { Delegate } from 'shared/model/delegate';

class DelegateRepository {
    private memoryDelegates: { [publicKey: string]: Delegate } = {};
    private usernames: Set<string> = new Set<string>();

    public add(account: Account, params: { username?: string, url?: string } = {}) {
        const delegate: Delegate = new Delegate({
            username: params.username || '',
            url: params.url || '',
            missedBlocks: 0,
            forgedBlocks: 0,
            account: account,
            votes: 0
        });
        this.memoryDelegates[account.publicKey] = delegate;
        this.usernames.add(delegate.username);
        return delegate;
    }

    public getDelegates(limit, offset): Array<Delegate> {
        return Object.values(this.memoryDelegates).sort((a, b) => {
            if (a.account.publicKey > b.account.publicKey) {
                return 1;
            }
            if (a.account.publicKey < b.account.publicKey) {
                return -1;
            }
            return 0;
        }).slice(offset, limit);
    }

    public getDelegate(publicKey: PublicKey): Delegate {
        return this.memoryDelegates[publicKey];
    }

    public getCount() {
        return Object.keys(this.memoryDelegates).length;
    }

    public getActiveDelegates(limit?: number, offset?: number): Array<Delegate> {
        let activeDelegates: Array<Delegate> = Object.values(this.memoryDelegates).sort((a, b) => {
            if (a.votes < b.votes) {
                return 1;
            }
            if (a.votes > b.votes) {
                return -1;
            }
            return 0;
        }).slice(0, config.CONSTANTS.ACTIVE_DELEGATES);

        if (activeDelegates.length > 0) {
            if (limit) {
                activeDelegates = activeDelegates.slice(offset || 0, limit);
            }
            return activeDelegates;
        }
    }

    public update(delegate: Delegate) {
        if (!delegate.account) {
            return false;
        }
        const presentedDelegate = this.memoryDelegates[delegate.account.publicKey];
        if (!presentedDelegate) {
            return false;
        }
        const oldName = this.memoryDelegates[delegate.account.publicKey].username;
        if (oldName !== delegate.username) {
            this.usernames.delete(oldName);
            this.usernames.add(delegate.username);
        }
        this.memoryDelegates[delegate.account.publicKey] = delegate;
        return true;
    }

    public getByPublicKey(publicKey: string): Delegate {
        return this.memoryDelegates[publicKey];
    }

    public isUserNameExists(username: string): boolean {
        return this.usernames.has(username);
    }

    public delete(account: Account): void {
        this.usernames.delete(this.memoryDelegates[account.publicKey].username);
        delete this.memoryDelegates[account.publicKey];
    }

    public serialize(delegate: Delegate): object {
        return {
            username: delegate.username,
            missedBlocks: delegate.missedBlocks,
            forgedBlocks: delegate.forgedBlocks,
            publicKey: delegate.account.publicKey,
            votes: delegate.votes,
        };
    }
}

export default new DelegateRepository();
