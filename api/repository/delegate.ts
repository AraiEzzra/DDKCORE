import { Delegate } from 'shared/model/delegate';

// TODO Transaction model
declare class Transaction {}

export interface IDelegateRepository {
    count(): Promise<{ count: number }>;

    search(q: string, limit: number, sortField: string, sortMethod: string): Promise<{delegates: Delegate[]}>;

    getVoters(publicKey: string): Promise<{accounts: string[]}>;

    getLatestVoters(limit: number): Promise<Transaction[]>;

    getLatestDelegates(limit: number): Promise<Transaction[]>;
}

export class DelegateRepository implements IDelegateRepository {

    count(): Promise<any>;

    search(q: string, limit: number, sortField: string, sortMethod: string): Promise<any>;

    getVoters(publicKey: string): Promise<any>;

    getLatestVoters(limit: number): Promise<any>;

    getLatestDelegates(limit: number): Promise<any>;
}
