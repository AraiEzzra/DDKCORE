import { Delegate } from 'shared/model/delegate';

// TODO need model Transaction
declare class Transaction {}

// TODO need model Block
declare class Block {}

interface IResponceGetBlockSlotData {
    time: bigint;
    keypair: Object;
}

export interface IDelegateService {
    getBlockSlotData(slot: number, height: number): Promise<void | IResponceGetBlockSlotData>;

    forge(): Promise<void>;

    checkDelegates(publicKey: string, votes: Transaction[], state: string): Promise<void | Error>;

    loadDelegates(): Promise<void>;

    generateDelegateList(height: number, source?: string[]): Promise<string[]>;

    fork(block: Block, cause: string): Promise<void | Error>;

    validateBlockSlot(block: Block, source: string[]): Promise<void | Error>;

    sandboxApi(args: any): void;

    onBind(scope: any) : void;

    onBlockchainReadyForForging(): boolean;

    cleanup(): boolean;

    getDelegatesFromPreviousRound(): Promise<string[]>;

    validateBlockSlotAgainstPreviousRound(): Promise<void>;
}


