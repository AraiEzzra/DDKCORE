import * as bignum from 'src/helpers/bignum.js';
import * as crypto from 'crypto';
import { Account } from 'src/helpers/types';
import * as AccountsSql from 'src/sql/accounts.js';

export const generateAddressByPublicKey = (publicKey) => {
    // any because bad types in node, allow hex
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex' as any).digest();
    const temp = Buffer.alloc(8);

    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    const address = `DDK${bignum.fromBuffer(temp).toString()}`;

    if (!address) {
        throw `Invalid public key: ${publicKey}`;
    }

    return address;
};

export const getAccountByAddress = async (db: any, address: string): Promise<Account> =>
    db.oneOrNone(AccountsSql.getAccountByAddress, { address });

export const getOrCreateAccount = async (db: any, publicKey: string): Promise<Account> => {

    const address = generateAddressByPublicKey(publicKey);
    // TODO change to publicKey
    let sender = await db.oneOrNone(AccountsSql.getAccountByAddress, {
        address
    });

    if (!sender) {
        try {
            sender = await db.one(AccountsSql.createNewAccount, {
                publicKey,
                address
            });
        } catch (e) {
            sender = await db.oneOrNone(AccountsSql.getAccountByAddress, {
                address
            });
        }

    }
    return new Account(sender);
};

export default exports = {
    generateAddressByPublicKey,
    getOrCreateAccount
};
