import { DelegateModel } from 'shared/model/delegate';

export class DelegateRepo {

    getDelegate(publicKey: string, username: string): Promise<DelegateModel> {
        return;
    }

    getDelegates(orderBy: string, limit: number, offset: number): Promise<DelegateModel[]> {
        return;
    }
}
