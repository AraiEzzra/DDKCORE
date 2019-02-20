import Response from 'shared/model/response';
import { Account } from 'shared/model/account';
import Config from 'shared/util/config';
import { IDelegate } from 'shared/model/delegate';

const constants = Config.constants;

class DelegateRepository {
    private memoryDelegates: Array<IDelegate> = [];
    
    public addDelegate(delegate: IDelegate) {
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
    }

    /**
     * @implements constants.activeDelegates
     * @return Array<Account>
     */
    public getActiveDelegates(): Response<Array<IDelegate>> {
        return new Response({data: this.memoryDelegates.slice(0, constants.activeDelegates)});
    }

    public updateDelegate(delegate: IDelegate) {
        for (let i = 0; i < this.memoryDelegates.length; i++) {
            if ( delegate.account.address === this.memoryDelegates[i].account.address) {
                this.memoryDelegates[i] = delegate;
            }
        }
    }
}

export default new DelegateRepository();
