import { DelegateModel } from 'shared/model/delegate';
import { DelegateRepo } from '../repository/delegate';

export class DelegateService {
    private readonly drepo = new DelegateRepo();

    private readonly sortFields: [
        'username',
        'address',
        'publicKey',
        'vote',
        'missedblocks',
        'producedblocks',
        'approval',
        'productivity',
        'voters_cnt',
        'register_timestamp'
    ];

    /**
     *  When will the implementation need to be removed 'void'
     */
    public async count(): Promise<number> {
        const result = await this.drepo.count();
        return result;
    }

    /**
     * Need to schema validate*
     */
    public async search(q, limit): Promise<DelegateModel[]> {
        const result = await this.drepo.search(q, limit, '', '');
        return result;
    }

    /**
     * Need to return Account Model
     */
    public async getVoters(publicKey): Promise<null> {
        const result = await this.drepo.getVoters(publicKey);
        return result ;
    }

}


