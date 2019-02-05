const constants = require('../helpers/constants.js');

// Private fields
let modules;
let library;
let self;

/**
 * Initializes library.
 * @memberof module:signatures
 * @class
 * @classdesc Main signature logic.
 * @param {ZSchema} schema
 * @param {Object} logger
 */
// Constructor
function Signature(schema, account, logger) {
    library = {
        schema,
        account,
        logger,
    };
    self = this;
}

/**
 * Binds input parameters to private variable modules
 * @param {Accounts} accounts
 */
Signature.prototype.bind = function (accounts) {
    modules = {
        accounts,
    };
};

/**
 * Creates a signature and sets related data.
 * @param {Object} data - Uses secondKeypair publicKey.
 * @param {transaction} trs - Transaction to add signature data to asset.
 * @returns {transaction} trs with new data
 */
Signature.prototype.create = function (data, trs) {
    trs.recipientId = null;
    trs.amount = 0;
    trs.asset.signature = {
        publicKey: data.secondKeypair.publicKey.toString('hex')
    };
    trs.trsName = 'SIGNATURE';
    return trs;
};

/**
 * Obtains constant fee secondsignature.
 * @see {@link module:helpers~constants}
 * @param {transaction} trs - Unnecessary parameter.
 * @param {account} sender - Unnecessary parameter.
 * @returns {number} Secondsignature fee.
 */
Signature.prototype.calculateFee = function () {
    return constants.fees.secondsignature;
};

Signature.prototype.newVerify = async (trs) => {
    if (!trs.asset || !trs.asset.signature) {
        throw new Error('Invalid transaction asset');
    }

    if (trs.amount !== 0) {
        throw new Error('Invalid transaction amount');
    }

    if (!trs.asset.signature.publicKey || Buffer.from(trs.asset.signature.publicKey, 'hex').length !== 32) {
        throw new Error('Invalid public key');
    }
};

Signature.prototype.newVerifyUnconfirmed = async () => {};

/**
 * Returns transaction with setImmediate.
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} Null error
 * @todo check extra parameter sender.
 */
Signature.prototype.process = function (trs, sender, cb) {
    return setImmediate(cb, null, trs);
};

/**
 * Returns a buffer with bytes from transaction asset information.
 * @requires bytebuffer
 * @see {@link https://github.com/dcodeIO/bytebuffer.js/wiki/API}
 * @param {transaction} trs - Uses multisignature from asset.
 * @returns {!Array} Contents as an ArrayBuffer.
 * @throws {error} If buffer fails.
 * @todo check if this function is called.
 */
Signature.prototype.getBytes = function (trs) {
    return Buffer.from(trs.asset.signature.publicKey, 'hex');
};

Signature.prototype.apply = async (trs) => {
    library.logger.debug(`[Signature][apply] transaction id ${trs.id}`);
    await library.account.asyncMerge(trs.senderId, {
        secondSignature: 1,
        secondPublicKey: trs.asset.signature.publicKey,
    });
};

Signature.prototype.undo = async (trs) => {
    library.logger.debug(`[Signature][undo] transaction id ${trs.id}`);
    await library.account.asyncMerge(trs.senderId, {
        address: trs.senderId,
        secondSignature: 0,
        secondPublicKey: null,
    });
};

/**
 * Activates unconfirmed second signature for sender account.
 * @implements module:accounts#Accounts~setAccountAndGet
 * @param {transaction} trs - Unnecessary parameter.
 * @param {block} block - Unnecessary parameter.
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Error if second signature is already enabled.
 */
Signature.prototype.applyUnconfirmed = function (trs, sender, cb) {
    modules.accounts.setAccountAndGet({ address: sender.address, u_secondSignature: 1 }, cb);
};

/**
 * Deactivates unconfirmed second signature for sender account.
 * @implements module:accounts#Accounts~setAccountAndGet
 * @param {transaction} trs - Unnecessary parameter.
 * @param {block} block - Unnecessary parameter.
 * @param {account} sender
 * @param {function} cb - Callback function.
 */
Signature.prototype.undoUnconfirmed = function (trs, sender, cb) {
    modules.accounts.setAccountAndGet({ address: sender.address, u_secondSignature: 0 }, cb);
};

Signature.prototype.calcUndoUnconfirmed = (trs, sender) => {
    sender.u_secondSignature = 0;
};

/**
 * @typedef signature
 * @property {publicKey} publicKey
 */
Signature.prototype.schema = {
    id: 'Signature',
    object: true,
    properties: {
        publicKey: {
            type: 'string',
            format: 'publicKey'
        }
    },
    required: ['publicKey']
};

/**
 * Validates signature schema.
 * @param {transaction} trs - Uses signature from asset.
 * @return {transaction} Transaction validated.
 * @throws {string} Error message.
 */
Signature.prototype.objectNormalize = function (trs) {
    const report = library.schema.validate(trs.asset.signature, Signature.prototype.schema);

    if (!report) {
        throw `Failed to validate signature schema:
         ${this.scope.schema.getLastErrors().map(err => err.message).join(', ')}`;
    }

    return trs;
};

/**
 * Creates signature object based on raw data.
 * @param {Object} raw - Data from database.
 * @return {multisignature} signature Object with transaction id.
 * @todo check if this function is called.
 */
Signature.prototype.dbRead = function (raw) {
    if (!raw.s_publicKey) {
        return null;
    }
    const signature = {
        transactionId: raw.t_id,
        publicKey: raw.s_publicKey
    };

    return { signature };
};

Signature.prototype.dbTable = 'signatures';

Signature.prototype.dbFields = [
    'transactionId',
    'publicKey'
];

/**
 * Creates database Object based on trs data.
 * @param {transaction} trs - Contains signature object.
 * @returns {Object} {table:signatures, values: publicKey and transaction id}.
 * @todo check if this function is called.
 */
Signature.prototype.dbSave = function (trs) {
    let publicKey;

    try {
        publicKey = trs.asset.signature.publicKey;
    } catch (e) {
        throw e;
    }

    return {
        table: this.dbTable,
        fields: this.dbFields,
        values: {
            transactionId: trs.id,
            publicKey
        }
    };
};

/**
 * Evaluates transaction signatures and sender multisignatures.
 * @param {transaction} trs - signatures.
 * @param {account} sender
 * @return {boolean} logic based on trs signatures and sender multisignatures.
 * @todo validate this logic, check if this function is called.
 */
Signature.prototype.ready = function (trs, sender) {
    if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
        if (!Array.isArray(trs.signatures)) {
            return false;
        }
        return trs.signatures.length >= sender.multimin;
    }
    return true;
};

// Export
module.exports = Signature;

/** ************************************* END OF FILE ************************************ */
