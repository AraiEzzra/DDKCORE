import { DelegateModel } from 'shared/model/delegate';

export class DelegateRepo {

    count(): number {
        return 0;
    }

    search(q, limit, sortField, sortMethod): Promise<DelegateModel[]> {
        return;
    }

    /**
     * Need to Account Model
     */
    getVoters(publicKey: string): Promise<string[]> {
        return;
    }
}

