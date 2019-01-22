import { DelegateModel } from 'shared/model/delegate';
import { DelegateRepo as sharedDelegateRepo } from 'shared/repository/delegate';
import { DelegateRepo } from '../repository/delegate';

export class DelegateService {
    private readonly drepo = new DelegateRepo();
    private readonly sharedDRepo = new sharedDelegateRepo();

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
     * Need to Account SQL
     */
    public async getVoters(publicKey): Promise<null> {
        const result = await this.drepo.getVoters(publicKey);
        return;
    }

    public async getDelegates(orderBy: string, limit: number, offset: number): Promise<{
        delegates: DelegateModel[],
        totalCount: number
    }> {
        const totalCount = await this.drepo.count();
        const delegates = await this.sharedDRepo.getDelegates(orderBy, limit, offset);
        return {
            totalCount,
            delegates
        };
    }

    public async getDelegate(publicKey: string, username: string): Promise<DelegateModel> {
        this.sharedDRepo.getDelegate(publicKey, username);
        return;
    }
}


