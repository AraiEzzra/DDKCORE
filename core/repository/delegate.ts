import { Account } from 'shared/model/account';
import { Delegate, SerializedDelegate } from 'shared/model/delegate';
import { PublicKey } from 'shared/model/types';
import { Sort, customSort } from 'shared/util/common';
import { sortByKey } from 'shared/util/util';

export const sortingDelegateFuncs = {
    approval: sortByKey('approval'),
    publicKey: sortByKey('account.publicKey'),
    username: sortByKey('username'),
    votes: sortByKey('votes'),
};

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
            approval: 0,
        });
        this.memoryDelegates.set(account.publicKey, delegate);
        this.usernames.add(delegate.username);
        return delegate;
    }

    public getAll(): Array<Delegate> {
        return [...this.memoryDelegates.values()];
    }

    public getMany(
        filter: { limit: number, offset: number, username: string },
        sort: Array<Sort>,
    ): { delegates: Array<Delegate>, count: number } {
        let delegates = this.getAll();
        if (filter.username) {
            delegates = delegates.filter(
                delegate => delegate.username.toLowerCase().includes(filter.username.toLowerCase()),
            );
        }

        return {
            delegates: customSort<Delegate>(delegates, sortingDelegateFuncs, { ...filter, sort }),
            count: delegates.length,
        };
    }

    public getDelegate(publicKey: PublicKey): Delegate {
        return this.memoryDelegates.get(publicKey) || null;
    }

    public getCount() {
        return this.memoryDelegates.size;
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
            approval: delegate.approval,
        };
    }
}

export default new DelegateRepository();
