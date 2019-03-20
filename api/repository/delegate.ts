import { Delegate } from 'shared/model/delegate';
import { ResponseEntity } from 'shared/model/response';

interface IDelegatesArray {
    delegates: Delegate[];
    totalCount?: number;
}

export interface IDelegateRepo {
    getDelegate(publicKey: string, username: string): Promise<ResponseEntity <{ delegate: Delegate }>>;

    getDelegates(orderBy: string, limit: number, offset: number): Promise<ResponseEntity<IDelegatesArray>>;
}

export class DelegateRepository implements IDelegateRepo {

    async getDelegate(publicKey: string, username: string): Promise<ResponseEntity<{ delegate: Delegate }>> {
        return new ResponseEntity({
            data: {
                delegate: new Delegate({ username }),
            }
        });
    }

    async getDelegates(orderBy: string, limit: number, offset: number): Promise<ResponseEntity<IDelegatesArray>> {
        return new ResponseEntity({
            data: {
                delegates: []
            }
        });
    }
}
