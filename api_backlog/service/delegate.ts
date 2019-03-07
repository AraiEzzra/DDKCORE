import Response from 'shared/model/response';
import { Transaction } from 'shared/model/transaction';

interface IResponseGetBlockSlotData {
    time: bigint;
    keyPair: Object;
}

export interface IDelegateService {
    getBlockSlotData(slot: number, height: number): Promise<Response<IResponseGetBlockSlotData>>;

    checkDelegates(publicKey: string, votes: Array<Transaction<any>>, state: string): Promise<Response<void>>;

    generateDelegateList(height: number, source?: string[]): Promise<Response<void>>;

    getDelegatesFromPreviousRound(): Promise<Response<string[]>>;
}



