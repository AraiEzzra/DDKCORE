import { Delegate } from 'shared/model/delegate';

interface IDelegatesArray {
    delegates: Delegate[];
    totalCount?: number;
}

export interface IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<{ delegate: Delegate }>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<IDelegatesArray>;
}

export class DelegateRepository implements IDelegateRepo {

    getDelegate(publicKey: string, username: string): Promise<{ delegate: Delegate }> {
        // Remove
        return Promise.resolve({ delegate: new Delegate('', '') });
    }

    getDelegates(orderBy: string, limit: number, offset: number): Promise<IDelegatesArray> {
        // Remove
        return Promise.resolve({
            delegates: [],
            totalCount: 0
        });
    }
}
