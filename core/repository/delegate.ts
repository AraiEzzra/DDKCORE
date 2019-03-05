import Response from 'shared/model/response';
import { Account } from 'shared/model/account';
import Config from 'shared/util/config';
import { Delegate } from 'shared/model/delegate';

const constants = Config.constants;

class DelegateRepository {
    private memoryDelegates: { [publicKey: string]: Delegate } = {};
    private usernames: Set<string> = new Set<string>();

    public add(account: Account, params: {username?: string, url?: string} = {}) {
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
    public getActiveDelegates(): Response<Array<Delegate>> {
        const activeDelegates: Array<Delegate> = Object.values(this.memoryDelegates).sort((a, b) => {
            if (a.votes > b.votes) {
                return 1;
            }
            if (a.votes < b.votes) {
                return -1;
            }
            return 0;
        }).slice(0, constants.activeDelegates);
        if (activeDelegates.length > 0) {
            return new Response({data: activeDelegates});
        } else {
            return new Response({errors: [`[DelegateRepository][getActiveDelegates] Can't get Active delegates`]});
        }
    }

    public update(delegate: Delegate) {
        const oldName = this.memoryDelegates[delegate.account.publicKey].username;
        if (oldName !== delegate.username) {
            this.usernames.delete(oldName);
            this.usernames.add(delegate.username);
        }
        this.memoryDelegates[delegate.account.publicKey] = delegate;
    }

    public getByPublicKey(publicKey: string): Delegate {
        return this.memoryDelegates[publicKey];
    }

    public forgingDisable(data: any) {

    }

    public forgingEnable(data: any) {

    }

    public forgingStatus(publicKey: string) {

    }

    public isUserNameExists(username: string): boolean {
        return this.usernames.has(username);
    }

    public delete(account: Account): void {
        delete this.memoryDelegates[account.publicKey];
    }
}

export default new DelegateRepository();
