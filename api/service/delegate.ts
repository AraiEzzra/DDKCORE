import { Delegate } from 'shared/model/delegate';
import Response from 'shared/model/response';
import { IModelTransaction, TransactionType, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';

// TODO need model Block
declare class Block {}

interface IResponseGetBlockSlotData {
    time: bigint;
    keypair: Object;
}

export interface IDelegateService {
    getBlockSlotData(slot: number, height: number): Promise<Response<IResponseGetBlockSlotData>>;

    forge(): Promise<void>;

    checkDelegates(publicKey: string, votes: Array<Transaction<any>>, state: string): Promise<Response<void>>;

    loadDelegates(): Promise<Response<void>>;

    generateDelegateList(height: number, source?: string[]): Promise<Response<void>>;

    fork(block: Block, cause: string): Promise<Response<void>>;

    validateBlockSlot(block: Block, source: string[]): Promise<Response<void>>;

    sandboxApi(args: any): Response<void>;

    onBind(scope: any): Response<void>;

    onBlockchainReadyForForging(): Response<boolean>;

    getDelegatesFromPreviousRound(): Promise<Response<string[]>>;

    validateBlockSlotAgainstPreviousRound(): Promise<Response<void>>;


}



