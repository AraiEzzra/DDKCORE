const ip = require('ip');
/**
 * Uses JSON Schema validator z_schema to register custom formats.
 * - id
 * - address
 * - username
 * - hex
 * - publicKey
 * - csv
 * - signature
 * - queryList
 * - delegatesList
 * - parsedInt
 * - ip
 * - os
 * - version
 * @see {@link https://github.com/zaggino/z-schema}
 * @memberof module:helpers
 * @requires ip
 * @constructor
 * @return {Boolean} True if the format is valid
 */
const z_schema = require('z-schema');

z_schema.registerFormat('id', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^[0-9a-fA-F]+$/g.test(str);
});

z_schema.registerFormat('address', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^(DDK)+[0-9]+$/ig.test(str);
});

z_schema.registerFormat('username', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^[a-z0-9!@$&_.]+$/ig.test(str);
});

z_schema.registerFormat('hex', (str) => {
    try {
        Buffer.from(str, 'hex');
    } catch (e) {
        return false;
    }

    return true;
});

z_schema.registerFormat('publicKey', (str) => {
    if (str.length === 0) {
        return true;
    }

    try {
        const publicKey = Buffer.from(str, 'hex');

        return publicKey.length === 32;
    } catch (e) {
        return false;
    }
});

z_schema.registerFormat('csv', (str) => {
    try {
        const a = str.split(',');
        if (a.length > 0 && a.length <= 1000) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
});

z_schema.registerFormat('signature', (str) => {
    if (str.length === 0) {
        return true;
    }

    try {
        const signature = Buffer.from(str, 'hex');
        return signature.length === 64;
    } catch (e) {
        return false;
    }
});

z_schema.registerFormat('queryList', (obj) => {
    obj.limit = 100;
    return true;
});

z_schema.registerFormat('delegatesList', (obj) => {
    obj.limit = 101;
    return true;
});

z_schema.registerFormat('parsedInt', (value) => {
    /* eslint-disable eqeqeq */
    if (isNaN(value) || parseInt(value) != value || isNaN(parseInt(value, 10))) {
        return false;
    }
    /* eslint-enable eqeqeq */
    value = parseInt(value);
    return true;
});

z_schema.registerFormat('ip', str => ip.isV4Format(str));

z_schema.registerFormat('os', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^[a-z0-9-_.+]+$/ig.test(str);
});

z_schema.registerFormat('version', (str) => {
    if (str.length === 0) {
        return true;
    }

    return /^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})([a-z]{1})?$/g.test(str);
});

// Exports
module.exports = z_schema;

/** ************************************* END OF FILE ************************************ */
