import { Delegate } from 'shared/model/delegate';
import Response from 'shared/model/response';
import { Account } from 'shared/model/account';
import { Transaction } from 'shared/model/transaction';

// TODO need to instance Block

interface IForkDelegate {
    delegatePublicKey: string;
    blockTimestamp: bigint;
    blockId: string;
    blockHeight: number;
    previousBlock: string;
    cause: string;
}

export interface IDelegateRepository {
    count(): Promise<Response<{ count: number }>>;

    search(q: string, limit: number, sortField: string, sortMethod: string):
        Promise<Response<{delegates: Delegate[]}>>;

    getVoters(publicKey: string): Promise<Response<{ accounts: string[]}>>;

    getLatestVoters(limit: number): Promise<Response<{ voters: Array<Transaction<Object>> }>>;

    getLatestDelegates(limit: number): Promise<Response<Array<Transaction<Object>>>>;

    insertFork(fork: IForkDelegate): Promise<Response<void>>;

    getDelegatesFromPreviousRound(): Promise<Response<string[]>>;
}

export class DelegateRepository implements IDelegateRepository {

    async count(): Promise<Response<{ count: number }>> {
        return new Response({
            data: {count: 0}
        });
    }

    async search(q: string, limit: number, sortField: string, sortMethod: string):
        Promise<Response<{ delegates: Delegate[] }>> {
        return new Response({
            data: {
                delegates: []
            }
        });
    }

    async getVoters(publicKey: string): Promise<Response<{ accounts: string[] }>> {
        return new Response({
            data: {
                accounts: []
            }
        });
    }

    async getLatestVoters(limit: number): Promise<Response<{ voters: Array<Transaction<Object>> }>> {
        return new Response({
            data: {
                voters: []
            }
        });
    }

    async getLatestDelegates(limit: number): Promise<Response<Array<Transaction<Object>>>> {
        return new Response({
            data: []
        });
    }

    async insertFork(fork: IForkDelegate): Promise<Response<void>> {
        return new Response({});
    }

    async getDelegatesFromPreviousRound(): Promise<Response<string[]>> {
        return new Response({
            data: []
        });
    }
}

