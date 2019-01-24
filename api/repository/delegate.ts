import { Delegate } from 'shared/model/delegate';
import Responce from 'shared/model/response';
import {Account} from 'shared/model/account';
import { Transaction } from 'shared/model/transaction';

// TODO need to instance Block
declare class Block {}

interface IForkDelegate {
    delegatePublicKey: string;
    blockTimestamp: bigint;
    blockId: string;
    blockHeight: number;
    previousBlock: string;
    cause: string;
}

interface IRawDBRead {
    d_username: string;
    t_senderPublicKey: string;
    t_senderId: string;
}

interface IResponceDBRead {
    username: string;
    publicKey: string;
    address: string;
}

interface IResponceDBSave {
    table: string;
    fields: string;
    values: {
        username: string;
        transactionId: string
    };
}

export interface IDelegateRepository {
    count(): Promise<Responce<{ count: number }>>;

    search(q: string, limit: number, sortField: string, sortMethod: string):
        Promise<Responce<{delegates: Delegate[]}>>;

    getVoters(publicKey: string): Promise<Responce<{ accounts: string[]}>>;

    getLatestVoters(limit: number): Promise<Responce<{ voters: Array<Transaction<Object>> }>>;

    getLatestDelegates(limit: number): Promise<Responce<Array<Transaction<Object>>>>;

    insertFork(fork: IForkDelegate): Promise<Responce<void>>;

    getDelegatesFromPreviousRound(): Promise<Responce<string[]>>;

    apply(trs: Transaction<Object>, block: Block, sender: Account): Promise<Responce<void>>;

    undo(trs: Transaction<Object>, block: Block, sender: Account): Promise<Responce<void>>;

    applyUnconfirmed(trs: Transaction<Object>, block: Block, sender: Account): Responce<void>;

    applyUnconfirmed(trs: Transaction<Object>, block: Block, sender: Account): Responce<void>;

    objectNormalize(trs: Transaction<Object>): Responce<Transaction<Object>>;

    dbRead(raw: IRawDBRead): Responce<{ delegate: IResponceDBRead }>;

    dbSave(trs: Transaction<Object>): Responce<IResponceDBSave>;

    // ready(): ResponceContainer<>;
}

export class DelegateRepository implements IDelegateRepository {

    async count(): Promise<Responce<{count: number}>> {
        return new Responce({
            data: {count: 0}
        });
    }

    async search(q: string, limit: number, sortField: string, sortMethod: string) :
                                                            Promise<Responce<{delegates: Delegate[]}>> {
        return new Responce({ data: {
                delegates: []
            }
        });
    }

    async getVoters(publicKey: string): Promise<Responce<{accounts: string[]}>> {
        return new Responce({
            data: {
                accounts: []
            }
        });
    }

    async getLatestVoters(limit: number): Promise<Responce<{ voters: Array<Transaction<Object>> }>> {
        return  new Responce({
            data: {
                voters: []
            }
        });
    }

    async getLatestDelegates(limit: number): Promise<Responce<Array<Transaction<Object>>>> {
        return new Responce({
            data: []
        });
    }

    async insertFork(fork: IForkDelegate): Promise<Responce<void>> {
        return new Responce({});
    }

    async getDelegatesFromPreviousRound(): Promise<Responce<string[]>> {
        return new Responce({
            data: []
        });
    }

    async apply(): Promise<Responce<void>> {
        return new Responce({});
    }

    async undo(): Promise<Responce<void>> {
        return new Responce({});
    }

    applyUnconfirmed(): Responce<void> {
        return new Responce({});
    }

    undoUnconfirmed(): Responce<void> {
        return new Responce({});
    }

    objectNormalize(trs: Transaction<Object>): Responce<Transaction<Object>> {
        return new Responce({
            data: null
        });
    }

    dbRead(raw: IRawDBRead): Responce<{ delegate: IResponceDBRead }> {
        return new Responce({
            data: {
                delegate: {
                    username: '',
                    publicKey: '',
                    address: ''
                }
            }
        });
    }

    dbSave(trs: Transaction<Object>): Responce<IResponceDBSave> {
        return new Responce<IResponceDBSave>({
            data: {
                table: '',
                fields: '',
                values: {
                    username: '',
                    transactionId: ''
                }
            }
        });
    }}

