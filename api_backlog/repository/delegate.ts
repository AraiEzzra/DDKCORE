import { Delegate } from 'shared/model/delegate';
import Response from 'shared/model/response';
import { Account } from 'shared/model/account';
import { Transaction, TransactionType } from 'shared/model/transaction';
import { getAddressByPublicKey } from 'shared/util/account';

interface IForkDelegate {
    delegatePublicKey: string;
    blockTimestamp: bigint;
    blockId: string;
    blockHeight: number;
    previousBlock: string;
    cause: string;
}

interface IForgedByAccountResponse {
    fees: number | bigint;
    rewards: number | bigint;
    forged: number | bigint;
    count: number;
}

export interface IDelegateRepository {
    count(): Promise<Response<{ count: number }>>;

    search(q: string, limit: number, sortField: string, sortMethod: string):
        Promise<Response<{delegates: Delegate[]}>>;

    getVoters(publicKey: string): Promise<Response<{ accounts: string[]}>>;

    getForgedByAccount(data: any): Promise<Response<IForgedByAccountResponse>>;
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

    async getForgedByAccount(data: any): Promise<Response<IForgedByAccountResponse>> {
        return new Response({
            data: {
                fees: 0,
                rewards: 0,
                forged: 0,
                count: 0
            }
        });
    }

    /**
     * Create transaction for to register new Account
     * TODO
     */
    @RPC('ADD_DELEGATE')
    addDelegates(data) {
        const senderId = getAddressByPublicKey(data.publicKey);
        const body = {
            trsName: TransactionType.DELEGATE,
            senderPublicKey: data.publicKey,
            signature: '',
            senderId,
            assetTypes: new Account(data.account)
        };
        const trs: Transaction<any> = new Transaction();
    }
}

