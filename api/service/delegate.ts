import { Delegate } from 'shared/model/delegate';
import Response from 'shared/model/response';
import { IModelTransaction, TransactionType, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { Block } from 'shared/model/block';

interface IResponseGetBlockSlotData {
    time: bigint;
    keypair: Object;
}

export interface IDelegateService {
    getBlockSlotData(slot: number, height: number): Promise<Response<IResponseGetBlockSlotData>>;

    checkDelegates(publicKey: string, votes: Array<Transaction<any>>, state: string): Promise<Response<void>>;

    generateDelegateList(height: number, source?: string[]): Promise<Response<void>>;

    getDelegatesFromPreviousRound(): Promise<Response<string[]>>;
}



