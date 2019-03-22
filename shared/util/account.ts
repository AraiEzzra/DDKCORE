import crypto from 'crypto';
import { Address, PublicKey } from 'shared/model/account';

export enum EnumSize {
    INT64 = 8
}

const ADDRESS_LENGTH = 8;
const HEXADECIMAL = 16;

/**
 *
 * @param publicKey
 */
export const getAddressByPublicKey = (publicKey: PublicKey): Address => {
    // @ts-ignore
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    const temp = Buffer.alloc(EnumSize.INT64);
    for (let i = 0; i < ADDRESS_LENGTH; i++) {
        temp[i] = publicKeyHash[ADDRESS_LENGTH - 1 - i];
    }
    return BigInt(getBodyAddress(temp).toString());
};

const getBodyAddress = (buf: Buffer): string => {
    const hex = [];
    for (let i = 0; i < buf.length; i++) {
        const c = (buf[i] < HEXADECIMAL ? '0' : '') + buf[i].toString(HEXADECIMAL);
        hex.push(c);
    }
    return `0x${hex.join('')}`;
};
