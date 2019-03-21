import { ResponseEntity } from 'shared/model/response';
import { Account, Address } from 'shared/model/account';
import Config from 'shared/util/config';
import { Delegate } from 'shared/model/delegate';

const constants = Config.constants;

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

    /**
     * @implements constants.activeDelegates
     * @return Array<Account>
     */
    public getActiveDelegates(): ResponseEntity<Array<Delegate>> {
        const activeDelegates: Array<Delegate> = Object.values(this.memoryDelegates).sort((a, b) => {
            if (a.votes < b.votes) {
                return 1;
            }
            if (a.votes > b.votes) {
                return -1;
            }
            return 0;
        }).slice(0, constants.activeDelegates);
        if (activeDelegates.length > 0) {
            return new ResponseEntity({ data: activeDelegates });
        } else {
            return new ResponseEntity({
                errors: [
                    `[DelegateRepository][getActiveDelegates] Can't get Active delegates`
                ]
            });
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
}

export default new DelegateRepository();
