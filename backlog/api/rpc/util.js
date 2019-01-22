const ZSchema = require('z-schema');
const Mnemonic = require('bitcore-mnemonic');


module.exports.createServerRPCMethod = function (methodName, callback) {
    Object.defineProperty(callback, 'methodName', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: methodName
    });

    Object.defineProperty(callback, 'methodId', {
        enumerable: false,
        configurable: false,
        writable: true,
        value: 0
    });

    return callback;
};

module.exports.schemaValidator = function (json, schema) {
    const validator = new ZSchema();
    return validator.validate(json, schema);
};

module.exports.mnemonicValidator = function (secret) {
    return Mnemonic.isValid(secret, Mnemonic.Words.ENGLISH);
};
