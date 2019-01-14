const sodium = require('sodium-javascript');

/**
 * Crypto functions that implements sodium.
 * @memberof module:helpers
 * @requires sodium
 * @namespace
 */
const ed = {};

/**
 * Creates a keypar based on a hash.
 * @implements {sodium}
 * @param {hash} hash
 * @return {Object} publicKey, privateKey
 */
ed.makeKeypair = function (hash) {
    const keyPair = {
        publicKey: Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES),
        privateKey: Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
    };

    sodium.crypto_sign_seed_keypair(keyPair.publicKey, keyPair.privateKey, hash);
    return keyPair;
};

/**
 * Creates a signature based on a hash and a keypair.
 * @implements {sodium}
 * @param {hash} hash
 * @param {keyPair} keyPair
 * @return {signature} signature
 */
ed.sign = function (hash, keyPair) {
    const sig = Buffer.alloc(sodium.crypto_sign_BYTES);
    sodium.crypto_sign_detached(sig, hash, keyPair.privateKey);
    return sig;
};

/**
 * Verifies a signature based on a hash and a publicKey.
 * @implements {sodium}
 * @param {hash} hash
 * @param {signatureBuffer} signatureBuffer
 * @param {publicKeyBuffer} publicKeyBuffer
 * @return {Boolean} true id verified
 */
ed.verify = function (hash, signatureBuffer, publicKeyBuffer) {
    return sodium.crypto_sign_verify_detached(signatureBuffer, hash, publicKeyBuffer);
};

module.exports = ed;

/** ************************************* END OF FILE ************************************ */
