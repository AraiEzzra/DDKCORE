import Validator, { registerFormat } from 'z-schema';
import { PublicKey } from 'shared/model/account';
import { VoteType } from 'shared/model/transaction';

const enum LENGTH {
    PUBLIC_KEY_SIZE = 32,
    SIGNATURE_SIZE = 64,
}

const isPublicKey = (str: PublicKey) => {
    try {
        const publicKey = Buffer.from(str, 'hex');

        return publicKey.length === LENGTH.PUBLIC_KEY_SIZE;
    } catch (e) {
        return false;
    }
};

Validator.registerFormat('id', (str) => {
    try {
        const publicKey = Buffer.from(str, 'hex');
        return publicKey.length === LENGTH.PUBLIC_KEY_SIZE;
    } catch (e) {
        return false;
    }
});

Validator.registerFormat('address', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^\d{15,21}$/.test(str);
});

Validator.registerFormat('username', (str) => {
    return /^[a-z0-9!@$&_.]{1,20}$/ig.test(str);
});

Validator.registerFormat('hex', (str) => {
    try {
        Buffer.from(str, 'hex');
    } catch (e) {
        return false;
    }

    return true;
});

Validator.registerFormat('publicKey', isPublicKey);

Validator.registerFormat('signature', (str) => {
    if (str.length === 0) {
        return true;
    }

    try {
        const signature = Buffer.from(str, 'hex');
        return signature.length === LENGTH.SIGNATURE_SIZE;
    } catch (e) {
        return false;
    }
});

Validator.registerFormat('version', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})([a-z]{1})?$/g.test(str);
});

Validator.registerFormat('secret', (str) => {
    return /^(\w+\s){11}\w+$/.test(str);
});

Validator.registerFormat('vote', (str) => {
    return new RegExp(`^[${VoteType.VOTE}${VoteType.DOWN_VOTE}]`, 'g').test(str) && isPublicKey(str.substr(1));
});

export default Validator;
