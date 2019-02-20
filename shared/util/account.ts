const crypto = require('crypto');
import { Account } from 'shared/model/account';

declare const BigInt;
enum EnumSize  {
    INT64 = 8
}

/**
 *
 * @param publicKey
 */
export const getAddressByPublicKey = (publicKey: string): string => {
    const publicKeyHash = crypto.createHash('sha256')
        .update(publicKey, 'hex')
        .digest();

    const temp = Buffer.alloc(EnumSize.INT64);
    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }
    return `DDK${getBodyAddress(temp).toString()}`;
};

/**
 *
 * @param publicKey
 */
export const getOrCreateAccount = async (publicKey: string): Promise<Account> => {
    return null;
};


const getBodyAddress = (buf) => {
    const hex = [];
    for (let i = 0; i < buf.length; i++) {
        const c = (buf[i] < 16 ? '0' : '') + buf[i].toString(16);
        hex.push(c);
    }
    return `0x${hex.join('')}`;
};
