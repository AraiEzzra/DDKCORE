import { Delegate } from 'shared/model/delegate';
import Responce from 'shared/model/response';

interface IDelegatesArray {
    delegates: Delegate[];
    totalCount?: number;
}

export interface IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<Responce <{ delegate: Delegate }>>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<Responce<IDelegatesArray>>;
}

export class DelegateRepository implements IDelegateRepo {

    async getDelegate(publicKey: string, username: string): Promise<Responce<{ delegate: Delegate }>> {
        return new Responce({
            data: {
                delegate: new Delegate('', ''),
            }
        });
    }

    async getDelegates(orderBy: string, limit: number, offset: number): Promise<Responce<IDelegatesArray>> {
        return new Responce({
            data: {
                delegates: []
            }
        });
    }
}
