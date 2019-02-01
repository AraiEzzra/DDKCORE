import Response from 'shared/model/response';
import { Transaction } from 'shared/model/transaction';

interface IResponseGetBlockSlotData {
    time: bigint | number;
    keypair: Object;
}

export interface IDelegateService {
    getBlockSlotData(slot: number, height: number): Promise<Response<IResponseGetBlockSlotData>>;

    checkDelegates(publicKey: string, votes: Array<Transaction<any>>, state: string): Promise<Response<void>>;

    loadDelegates(): Promise<Response<void>>;

    generateDelegateList(height: number, source?: string[]): Promise<Response<void>>;

    sandboxApi(args: any): Response<void>;

    getDelegatesFromPreviousRound(): Promise<Response<string[]>>;
}

export class DelegateService implements IDelegateService {

    async getBlockSlotData(slot: number, height: number): Promise<Response<IResponseGetBlockSlotData>> {
        return new Response({
            data: {
                time: 0,
                keypair: {}
            }
        });
    }

    async checkDelegates(publicKey: string, votes: Array<Transaction<any>>, state: string): Promise<Response<void>> {
        return new Response({});
    }

    async loadDelegates(): Promise<Response<void>> {
        return new Response({});
    }

    async generateDelegateList(height: number, source?: string[]): Promise<Response<void>> {
        return new Response({});
    }

    sandboxApi(args: any): Response<void> {
        return new Response({});
    }

    async getDelegatesFromPreviousRound(): Promise<Response<string[]>> {
        return new Response({
            data: []
        });
    }
}

