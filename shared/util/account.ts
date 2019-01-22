const crypto = require('./crypto');
const bignum = require('../utils/bignum');

const BUFFER_SIZE = 8;

export const generateAddressByPublicKey = (publicKey: string): string => {
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    const temp = Buffer.alloc(BUFFER_SIZE);

    for (let i = 0; i < BUFFER_SIZE; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    const address = `DDK${bignum.fromBuffer(temp).toString()}`;

    if (!address) {
        throw `Invalid public key: ${publicKey}`;
    }

    return address;
};

