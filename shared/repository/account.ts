const crypto = require('crypto');
import {Account, Address} from 'shared/model/account';
import ResponseEntity from 'shared/model/response';
import { getAddressByPublicKey } from 'shared/util/account';
import { ed } from 'shared/util/ed';

interface IAccountRepository {

    getAccountByAddress(address: string): Promise<Account>;

    getAccountByPublicKey(publicKey: string): Promise<Account>;

    getCountAccounts(): Promise<number>;

    getBalanceByAddress(address: string): Promise<number>;

    getCountAccountByAddress(address: string): Promise<number>;

    generatePublicKey(secret: string): string;
}

export class AccountRepository implements IAccountRepository {

    async getAccountByAddress(address: string): Promise<Account> {
        return null;
    }

    getAccountByPublicKey(publicKey: string): Promise<Account> {
        return undefined;
    }

    async getBalanceByAddress(address: string): Promise<number> {
        return 0;
    }

    getCountAccountByAddress(address: string): Promise<number> {
        return undefined;
    }

    getCountAccounts(): Promise<number> {
        return undefined;
    }

    async getAccount(publicKey: string): Promise<ResponseEntity<Account>> {
        const address: Address = getAddressByPublicKey(publicKey);
        return new ResponseEntity({
            data: null,
        });
    }

    public generatePublicKey(secret: string): string {
        const hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
        const publicKey: string = ed.makePublicKeyHex(hash);
        return publicKey;
    }
}
