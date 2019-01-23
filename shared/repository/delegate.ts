import { DelegateModel } from 'shared/model/delegate';

interface IDelegatesArray {
    delegates: DelegateModel[];
    totalCount?: number;
}

export interface IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<IDelegatesArray>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<IDelegatesArray>;
}

export class DelegateRepository implements IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<{ delegate: DelegateModel }>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<IDelegatesArray>;
}
