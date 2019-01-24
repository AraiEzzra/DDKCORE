import { Delegate } from 'shared/model/delegate';
import Responce from 'shared/model/response';
import { IModelTransaction, TransactionType, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';

// TODO need model Block
declare class Block {}

interface IResponceGetBlockSlotData {
    time: bigint;
    keypair: Object;
}

export interface IDelegateService {
    getBlockSlotData(slot: number, height: number): Promise<Responce<IResponceGetBlockSlotData>>;

    forge(): Promise<void>;

    checkDelegates(publicKey: string, votes: Array<Transaction<any>>, state: string): Promise<Responce<void>>;

    loadDelegates(): Promise<Responce<void>>;

    generateDelegateList(height: number, source?: string[]): Promise<Responce<void>>;

    fork(block: Block, cause: string): Promise<Responce<void>>;

    validateBlockSlot(block: Block, source: string[]): Promise<Responce<void>>;

    sandboxApi(args: any): Responce<void>;

    onBind(scope: any): Responce<void>;

    onBlockchainReadyForForging(): Responce<boolean>;

    getDelegatesFromPreviousRound(): Promise<Responce<string[]>>;

    validateBlockSlotAgainstPreviousRound(): Promise<Responce<void>>;

    create(data: any, trs: IModelTransaction<any>): Responce<Transaction<any>>;
    
    calculateFee(): Responce<number>;

    verify(trs: Transaction<Object>, sender: Account): Responce<Transaction<Object>>;

    getBytes(trs: Transaction<Object>): Responce<Buffer>;
}



