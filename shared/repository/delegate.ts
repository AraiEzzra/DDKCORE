import { Delegate } from 'shared/model/delegate';
import Response from 'shared/model/response';

interface IDelegatesArray {
    delegates: Delegate[];
    totalCount?: number;
}

export interface IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<Response <{ delegate: Delegate }>>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<Response<IDelegatesArray>>;
}

export class DelegateRepository implements IDelegateRepo {

    async getDelegate(publicKey: string, username: string): Promise<Response<{ delegate: Delegate }>> {
        return new Response({
            data: {
                delegate: new Delegate('', ''),
            }
        });
    }

    async getDelegates(orderBy: string, limit: number, offset: number): Promise<Response<IDelegatesArray>> {
        return new Response({
            data: {
                delegates: []
            }
        });
    }
}
