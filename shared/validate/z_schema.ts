const ip = require('ip');
import Validator, { registerFormat  } from 'z-schema';

const enum ENUMNumbers  {
    PUBLIC_KEY_SIZE = 32,
    SIGNATURE_SIZE  = 64,
    QUERY_LIST      = 100,
    DELEGATE_LIST   = 101,
    MAX_SIZE_STR    = 1000
}

Validator.registerFormat('id', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^[0-9a-fA-F]+$/g.test(str);
});

Validator.registerFormat('address', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^(DDK)+[0-9]+$/ig.test(str);
});

Validator.registerFormat('username', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^[a-z0-9!@$&_.]+$/ig.test(str);
});

Validator.registerFormat('hex', (str) => {
    try {
        Buffer.from(str, 'hex');
    } catch (e) {
        return false;
    }

    return true;
});

Validator.registerFormat('publicKey', (str) => {
    if (str.length === 0) {
        return true;
    }

    try {
        const publicKey = Buffer.from(str, 'hex');

        return publicKey.length === ENUMNumbers.PUBLIC_KEY_SIZE;
    } catch (e) {
        return false;
    }
});

Validator.registerFormat('csv', (str) => {
    try {
        const a = str.split(',');
        if (a.length > 0 && a.length <= ENUMNumbers.MAX_SIZE_STR) {
            return true;
        }
        return false;
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
        return signature.length === ENUMNumbers.SIGNATURE_SIZE;
    } catch (e) {
        return false;
    }
});

Validator.registerFormat('queryList', (obj) => {
    obj.limit = ENUMNumbers.QUERY_LIST;
    return true;
});

Validator.registerFormat('delegatesList', (obj) => {
    obj.limit = ENUMNumbers.DELEGATE_LIST;
    return true;
});

Validator.registerFormat('parsedInt', (value) => {
    /* eslint-disable eqeqeq */
    if (isNaN(value) || parseInt(value, 10) !== value || isNaN(parseInt(value, 10))) {
        return false;
    }
    value = parseInt(value, 10);
    return true;
});

Validator.registerFormat('ip', str => ip.isV4Format(str));

Validator.registerFormat('os', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^[a-z0-9-_.+]+$/ig.test(str);
});

Validator.registerFormat('version', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})([a-z]{1})?$/g.test(str);
});

export default Validator;
