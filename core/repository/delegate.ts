import Response from 'shared/model/response';
const crypto = require('crypto');
import { AccountRepository } from 'shared/repository/account';
import { Account } from 'shared/model/account';
import { ed } from 'shared/util/ed';

interface IForgingDisable {
    secret: string;
    publicKey: string;
}

export interface IDelegateRepository {
    forgingDisable(data: IForgingDisable): Promise<Response<any>>;

    forgingEnable(data: IForgingDisable): Promise<Response<any>>;
}

class DelegateRepository implements IDelegateRepository {
    private accountRepo: AccountRepository;

    constructor() {
        this.accountRepo = new AccountRepository();
    }

    async forgingDisable(data: IForgingDisable): Promise<Response<any>> {
        const hash = crypto.createHash('sha256').update(data.secret, 'utf8').digest();
        const publicKey: string = ed.makePublicKeyHex(hash);
        const account  = await this.accountRepo.getAccount(publicKey);
        if (!account) {
            return new Response({
                errors: ['Delegate not found']
            });
        }
        return new Response({
            data: {
                address: account.data.address
            }
        });
    }

    async forgingEnable(data: IForgingDisable): Promise<Response<Object>> {
        const hash = crypto.createHash('sha256').update(data.secret, 'utf8').digest();
        const publicKey: string = ed.makePublicKeyHex(hash);
        const account  = await this.accountRepo.getAccount(publicKey);
        if (account.data && account.data.isDelegate) {
            return new Response({
                data: {
                    address: account.data.address
                }
            });
        }
        return new Response({
            errors: ['Delegate not found']
        });
    }

    async forgingStatus(publicKey: string): Promise<Response<Object>> {
        return new Response({
            data: {
                enabled: true,
                delegates: []
            }
        });
    }

}

export const delegateCoreRepository = new DelegateRepository();
