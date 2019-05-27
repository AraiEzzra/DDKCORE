import { Account} from 'shared/model/account';
import config from 'shared/config';
import { Delegate, SerializedDelegate } from 'shared/model/delegate';
import { PublicKey } from 'shared/model/types';

class DelegateRepository {
    private memoryDelegates: Map<PublicKey, Delegate> = new Map();
    private usernames: Set<string> = new Set<string>();

    public add(account: Account, params: { username?: string, url?: string } = {}) {
        const delegate: Delegate = new Delegate({
            username: params.username || '',
            url: params.url || '',
            missedBlocks: 0,
            forgedBlocks: 0,
            account: account,
            votes: 0,
            confirmedVoteCount: 0,
        });
        this.memoryDelegates.set(account.publicKey, delegate);
        this.usernames.add(delegate.username);
        return delegate;
    }

    public getDelegates(limit: number, offset: number): Array<Delegate> {
        return [...this.memoryDelegates.values()].sort((a, b) => {
            if (a.account.publicKey > b.account.publicKey) {
                return 1;
            }
            if (a.account.publicKey < b.account.publicKey) {
                return -1;
            }
            return 0;
        }).slice(offset, offset + limit);
    }

    public getDelegate(publicKey: PublicKey): Delegate {
        return this.memoryDelegates.get(publicKey) || null;
    }

    public getCount() {
        return this.memoryDelegates.size;
    }

    public getActiveDelegates(limit?: number, offset?: number): Array<Delegate> {
        let activeDelegates: Array<Delegate> = [...this.memoryDelegates.values()].sort((a, b) => {
            if (a.confirmedVoteCount < b.confirmedVoteCount) {
                return 1;
            }
            if (a.confirmedVoteCount > b.confirmedVoteCount) {
                return -1;
            }
            return 0;
        }).slice(0, config.CONSTANTS.ACTIVE_DELEGATES);

        if (activeDelegates.length > 0) {
            if (limit) {
                activeDelegates = activeDelegates.slice(offset || 0, (offset || 0) + limit);
            }
            return activeDelegates;
        }
    }

    public isUserNameExists(username: string): boolean {
        return this.usernames.has(username);
    }

    public delete(account: Account): void {
        const delegate = this.getDelegate(account.publicKey);
        if (delegate) {
            this.usernames.delete(delegate.username);
        }
        this.memoryDelegates.delete(account.publicKey);
    }

    public serialize(delegate: Delegate): SerializedDelegate {
        return {
            username: delegate.username,
            missedBlocks: delegate.missedBlocks,
            forgedBlocks: delegate.forgedBlocks,
            publicKey: delegate.account.publicKey,
            votes: delegate.votes,
            confirmedVoteCount: delegate.confirmedVoteCount,
        };
    }
}

export default new DelegateRepository();
