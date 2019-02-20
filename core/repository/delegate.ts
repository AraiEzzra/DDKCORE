import Response from 'shared/model/response';
import { Account } from 'shared/model/account';
import Config from 'shared/util/config';
import { Delegate } from 'shared/model/delegate';

const constants = Config.constants;

class DelegateRepository {
    private memoryDelegates: Array<Delegate> = [];

    public addDelegate(account: Account, params: {username?: string, url?: string} = {}) {
        const delegate: Delegate = new Delegate({
            username: params.username || '',
            url: params.url || '',
            missedBlocks: 0,
            forgedBlocks: 0,
            account: account,
            votes: 0
        });
        
        this.memoryDelegates.push(delegate);
        this.memoryDelegates.sort((a, b) => {
            if (a.votes > b.votes) {
                return 1;
            }
            if (a.votes < b.votes) {
                return -1;
            }
            return 0;
        });
        
        return delegate;
    }

    /**
     * @implements constants.activeDelegates
     * @return Array<Account>
     */
    public getActiveDelegates(): Response<Array<Delegate>> {
        return new Response({data: this.memoryDelegates.slice(0, constants.activeDelegates)});
    }

    public updateDelegate(delegate: Delegate) {
        for (let i = 0; i < this.memoryDelegates.length; i++) {
            if ( delegate.account.address === this.memoryDelegates[i].account.address) {
                this.memoryDelegates[i] = delegate;
            }
        }
    }

    public forgingDisable(data: any) {

    }

    public forgingEnable(data: any) {

    }

    public forgingStatus(publicKey: string) {

    }
}

export default new DelegateRepository();
