import Validator, { registerFormat } from 'z-schema';
import { PublicKey } from 'shared/model/account';

const enum LENGTH {
    PUBLIC_KEY_SIZE = 32,
    SIGNATURE_SIZE = 64,
}

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

    return /^\d{17,21}$/.test(str);
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

Validator.registerFormat('publicKey', (str: PublicKey) => {
    try {
        const publicKey = Buffer.from(str, 'hex');

        return publicKey.length === LENGTH.PUBLIC_KEY_SIZE;
    } catch (e) {
        return false;
    }
});

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

export default Validator;
