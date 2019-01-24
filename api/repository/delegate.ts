import { Delegate } from 'shared/model/delegate';

// TODO Transaction model
declare class Transaction {}

interface IForkDelagate {
    delegatePublicKey: string;
    blockTimestamp: bigint;
    blockId: string;
    blockHeight: number;
    previousBlock: string;
    cause: string;
}

export interface IDelegateRepository {
    count(): Promise<{ count: number }>;

    search(q: string, limit: number, sortField: string, sortMethod: string): Promise<{delegates: Delegate[]}>;

    getVoters(publicKey: string): Promise<{ accounts: string[]}>;

    getLatestVoters(limit: number): Promise<{ voters: Transaction[] }>;

    getLatestDelegates(limit: number): Promise<Transaction[]>;

    insertFork(fork : IForkDelagate): Promise<void>;

    getDelegatesFromPreviousRound(): Promise<>;
}

export class DelegateRepository implements IDelegateRepository {

    count(): Promise<any>;

    search(q: string, limit: number, sortField: string, sortMethod: string): Promise<any>;

    getVoters(publicKey: string): Promise<any>;

    getLatestVoters(limit: number): Promise<any>;

    getLatestDelegates(limit: number): Promise<any>;

    insertFork(fork: IForkDelagate): Promise<any>;
}

