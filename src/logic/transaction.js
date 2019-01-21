const { TransactionStatus } = require('src/helpers/types');

const async = require('async');
const bignum = require('../helpers/bignum.js');
const sodium = require('sodium-javascript');
const transactionTypes = require('../helpers/transactionTypes.js');
const constants = require('../helpers/constants.js');
const crypto = require('crypto');
const exceptions = require('../helpers/exceptions.js');
const extend = require('extend');
const slots = require('../helpers/slots.js');
const sql = require('../sql/transactions.js');
const sqlAccount = require('../sql/accounts.js');
const sqlFroging = require('../sql/frogings.js');
const request = require('request');
const utils = require('../utils.js');
const BUFFER = require('../helpers/buffer.js');
const cryptoBrowserify = require('crypto-browserify');

const TRANSACTION_BUFFER_SIZE =
    BUFFER.LENGTH.HEX +         // salt
    BUFFER.LENGTH.BYTE +        // type
    BUFFER.LENGTH.UINT32 +      // timestamp
    BUFFER.LENGTH.HEX +         // senderPublicKey
    BUFFER.LENGTH.HEX +         // requesterPublicKey
    BUFFER.LENGTH.INT64 +       // recipientId
    BUFFER.LENGTH.INT64 +       // amount
    BUFFER.LENGTH.DOUBLE_HEX +  // signature
    BUFFER.LENGTH.DOUBLE_HEX;   // signSignature

// Private fields
let self;
let modules;
const __private = {};

/**
 * @typedef {Object} privateTypes
 * - 0: Transfer
 * - 1: Signature
 * - 2: Delegate
 * - 3: Vote
 * - 4: Multisignature
 * - 5: DApp
 * - 6: InTransfer
 * - 7: OutTransfer
 * - 8: STAKE
 */
__private.types = {};

/**
 * Main transaction logic.
 * @memberof module:transactions
 * @class
 * @classdesc Main transaction logic.
 * @param {Database} db
 * @param {Object} ed
 * @param {ZSchema} schema
 * @param {Object} genesisblock
 * @param {Account} account
 * @param {Object} logger
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} With `this` as data.
 */
// Constructor
function Transaction(db, ed, schema, genesisblock, account, logger, config, network, cb) {
    this.scope = {
        db,
        ed,
        schema,
        genesisblock,
        account,
        logger,
        config,
        network
    };
    self = this;
    if (cb) {
        return setImmediate(cb, null, this);
    }
}

// Public methods
/**
 * Creates transaction:
 * - Analyzes data types
 * - calls `create` based on data type (see privateTypes)
 * - calls `calculateFee` based on data type (see privateTypes)
 * - creates signatures
 * @see privateTypes
 * @implements {sign}
 * @implements {getId}
 * @param {Object} data
 * @return {transaction} trs
 */
Transaction.prototype.create = async (data) => {
    if (!__private.types[data.type]) {
        throw `Unknown transaction type ${data.type}`;
    }

    if (!data.sender) {
        throw 'Invalid sender';
    }

    if (!data.keypair) {
        throw 'Invalid keypair';
    }

    let trs = {
        type: data.type,
        amount: 0,
        senderPublicKey: data.sender.publicKey,
        requesterPublicKey: data.requester ? data.requester.publicKey.toString('hex') : null,
        timestamp: slots.getTime(),
        asset: {},
        stakedAmount: 0,
        trsName: 'NA',
        groupBonus: 0,
        salt: cryptoBrowserify.randomBytes(16).toString('hex'),
        reward: data.rewardPercentage || null
    };

    trs = await __private.types[trs.type].create.call(self, data, trs);
    trs.signature = self.sign(data.keypair, trs);

    if (data.sender.secondSignature && data.secondKeypair) {
        trs.signSignature = self.sign(data.secondKeypair, trs);
    }

    trs.id = self.getId(trs);
    trs.fee = __private.types[trs.type].calculateFee.call(self, trs, data.sender) || 0;

    return trs;
};

/**
 * Sets private type based on type id after instance object validation.
 * @param {number} typeId
 * @param {Object} instance
 * @return {Object} instance
 * @throws {string} Invalid instance interface if validations are wrong
 */
Transaction.prototype.attachAssetType = (typeId, instance) => {
    self.scope.logger.info(`typeID : ${typeId}`);
    if (instance &&
        typeof instance.create === 'function' &&
        typeof instance.getBytes === 'function' &&
        typeof instance.calculateFee === 'function' &&
        typeof instance.verify === 'function' &&
        typeof instance.objectNormalize === 'function' &&
        typeof instance.dbRead === 'function' &&
        typeof instance.apply === 'function' &&
        typeof instance.undo === 'function' &&
        typeof instance.applyUnconfirmed === 'function' &&
        typeof instance.undoUnconfirmed === 'function' &&
        typeof instance.ready === 'function' &&
        typeof instance.process === 'function'
    ) {
        self.scope.logger.info('asset type is attached successfully');
        __private.types[typeId] = instance;
        return instance;
    }
    self.scope.logger.info('error while attaching asset type');
    throw 'Invalid instance interface';
};

/**
 * Creates a signature
 * @implements {getHash}
 * @implements {scope.ed.sign}
 * @param {Object} keypair - Constains privateKey and publicKey
 * @param {transaction} trs
 * @return {signature} sign
 */
Transaction.prototype.sign = (keyPair, trs) => {
    const sig = Buffer.alloc(sodium.crypto_sign_BYTES);

    sodium.crypto_sign_detached(sig, self.getHash(trs), keyPair.privateKey);
    return sig.toString('hex');
};

/**
 * Creates a signature based on multiple signatures
 * @implements {getBytes}
 * @implements {crypto.createHash}
 * @implements {scope.ed.sign}
 * @param {Object} keypair - Constains privateKey and publicKey
 * @param {transaction} trs
 * @return {signature} sign
 */
Transaction.prototype.multisign = (keypair, trs) => {
    const bytes = self.getBytes(trs, true, true);
    const hash = crypto.createHash('sha256').update(bytes).digest();
    return self.scope.ed.sign(hash, keypair).toString('hex');
};

/**
 * Calculates transaction id based on transaction
 * @implements {bignum}
 * @implements {getHash}
 * @param {transaction} trs
 * @return {string} id
 */
Transaction.prototype.getId = trs => self.getHash(trs).toString('hex');

/**
 * Creates hash based on transaction bytes.
 * @implements {getBytes}
 * @implements {crypto.createHash}
 * @param {transaction} trs
 * @return {hash} sha256 crypto hash
 */
Transaction.prototype.getHash = trs => crypto.createHash('sha256').update(self.getBytes(trs, false, false)).digest();

/**
 * Calls `getBytes` based on trs type (see privateTypes)
 * @see privateTypes
 * @implements {ByteBuffer}
 * @param {transaction} trs
 * @param {boolean} skipSignature
 * @param {boolean} skipSecondSignature
 * @return {!Array} Contents as an ArrayBuffer.
 * @throws {error} If buffer fails.
 */
Transaction.prototype.getBytes = (trs, skipSignature = false, skipSecondSignature = false) => {
    const assetBytes = __private.types[trs.type].getBytes.call(self, trs, skipSignature, skipSecondSignature);

    self.scope.logger.trace(`Trs ${JSON.stringify(trs)}`);
    self.scope.logger.trace(`AssetBytes ${JSON.stringify(assetBytes)}`);

    const buff = Buffer.alloc(TRANSACTION_BUFFER_SIZE);
    let offset = 0;

    buff.write(trs.salt, offset, BUFFER.LENGTH.HEX);
    offset += BUFFER.LENGTH.HEX;

    offset = BUFFER.writeInt8(buff, trs.type, offset);
    offset = BUFFER.writeInt32LE(buff, trs.timestamp, offset);
    offset = BUFFER.writeNotNull(buff, trs.senderPublicKey, offset, BUFFER.LENGTH.HEX);
    offset = BUFFER.writeNotNull(buff, trs.requesterPublicKey, offset, BUFFER.LENGTH.HEX);

    if (trs.recipientId) {
        offset = BUFFER.writeUInt64LE(buff, parseInt(trs.recipientId.slice(3), 10), offset);
    } else {
        offset += BUFFER.LENGTH.INT64;
    }

    offset = BUFFER.writeUInt64LE(buff, trs.amount, offset);

    if (!skipSignature && trs.signature) {
        buff.write(trs.signature, offset, BUFFER.LENGTH.DOUBLE_HEX, 'hex');
    }
    offset += BUFFER.LENGTH.DOUBLE_HEX;

    if (!skipSecondSignature && trs.signSignature) {
        buff.write(trs.signSignature, offset, BUFFER.LENGTH.DOUBLE_HEX, 'hex');
    }
    return Buffer.concat([buff, assetBytes]);
};

/**
 * Calls `ready` based on trs type (see privateTypes)
 * @see privateTypes
 * @param {transaction} trs
 * @param {account} sender
 * @return {function|boolean} calls `ready` | false
 */
Transaction.prototype.ready = (trs, sender) => {
    if (!__private.types[trs.type]) {
        throw `Unknown transaction type ${trs.type}`;
    }

    if (!sender) {
        return false;
    }

    return __private.types[trs.type].ready.call(self, trs, sender);
};

/**
 * Counts transactions from `trs` table by id
 * @param {transaction} trs
 * @param {function} cb
 * @return {setImmediateCallback} error | row.count
 */
Transaction.prototype.countById = (trs, cb) => {
    self.scope.db.one(sql.countById, { id: trs.id })
        .then(row => setImmediate(cb, null, row.count))
        .catch((err) => {
            self.scope.logger.error(err.stack);
            return setImmediate(cb, 'Transaction#countById error');
        });
};

/**
 * @implements {countById}
 * @param {transaction} trs
 * @param {function} cb
 * @return {setImmediateCallback} error | cb
 */
Transaction.prototype.checkConfirmed = function (trs, cb) {
    self.countById(trs, (err, count) => {
        if (err) {
            return setImmediate(cb, err);
        } else if (count > 0) {
            return setImmediate(cb, `Transaction is already confirmed: ${trs.id}`);
        }
        return setImmediate(cb);
    });
};

Transaction.prototype.newCheckConfirmed = async (trs) => {
    let result = {};
    try {
        result = await self.scope.db.one(sql.countById, { id: trs.id })
    } catch (e) {
        self.scope.logger.error(e);
    }
    return Boolean(result.count)
};

/**
 * Checks if balance is less than amount for sender.
 * @implements {bignum}
 * @param {number} amount
 * @param {boolean} isUnconfirmed
 * @param {transaction} trs
 * @param {account} sender
 * @returns {Object} With exceeded boolean and error: address, balance
 *  modify checkbalance according to froze amount avaliable to user
 */
Transaction.prototype.checkBalance = (amount, isUnconfirmed, trs, sender) => {
    const totalAmountWithFrozeAmount = trs.type === transactionTypes.SENDSTAKE ?
        new bignum(amount)
        :
        new bignum(sender[`${isUnconfirmed ? 'u_' : ''}totalFrozeAmount`]).plus(amount);

    const exceededBalance = new bignum(sender[`${isUnconfirmed ? 'u_' : ''}balance`].toString())
        .lessThan(totalAmountWithFrozeAmount);
    let exceeded = (trs.blockId !== self.scope.genesisblock.block.id && exceededBalance);

    if (trs.height <= constants.MASTER_NODE_MIGRATED_BLOCK) {
        exceeded = false;
    }

    if (parseInt(sender[`${isUnconfirmed ? 'u_' : ''}totalFrozeAmount`], 10) > 0) {
        return {
            exceeded,
            error: exceeded ?
                [
                    'Account does not have enough DDK due to freeze amount:',
                    sender.address,
                    'balance:',
                    new bignum(sender[`${isUnconfirmed ? 'u_' : ''}balance`].toString() || '0').div(10 ** 8),
                    'totalFreezeAmount :',
                    new bignum(sender[`${isUnconfirmed ? 'u_' : ''}totalFrozeAmount`].toString())
                        .div(10 ** 8),
                    'amount: ',
                    amount / (10 ** 8)
                ].join(' ')
                :
                null
        };
    }
    return {
        exceeded,
        error: exceeded ?
            [
                'Account does not have enough DDK:',
                sender.address,
                'balance:',
                new bignum(sender[`${isUnconfirmed ? 'u_' : ''}balance`].toString() || '0').div(10 ** 8),
                'amount: ',
                amount / (10 ** 8)
            ].join(' ')
            :
            null
    };
};

/**
 * Validates parameters.
 * Calls `process` based on trs type (see privateTypes)
 * @see privateTypes
 * @implements {getId}
 * @param {transaction} trs
 * @param {account} sender
 * @param {account} requester
 * @param {function} cb
 * @return {setImmediateCallback} validation errors | trs
 */
Transaction.prototype.process = (trs, sender, requester, cb) => {
    if (typeof requester === 'function') {
        cb = requester;
    }

    // Check transaction type
    if (!__private.types[trs.type]) {
        return setImmediate(cb, `Unknown transaction type ${trs.type}`);
    }

    // if (!this.ready(trs, sender)) {
    //     return setImmediate(cb, 'Transaction is not ready: ' + trs.id);
    // }

    // Check sender
    if (!sender) {
        return setImmediate(cb, 'Missing sender');
    }

    // Get transaction id
    let txId;

    try {
        txId = self.getId(trs);
    } catch (e) {
        self.scope.logger.error(e.stack);
        return setImmediate(cb, 'Failed to get transaction id');
    }

    // Check transaction id
    if (trs.id && trs.id !== txId) {
        return setImmediate(cb, 'Invalid transaction id');
    }
    trs.id = txId;


    // Equalize sender address
    trs.senderId = sender.address;

    // Call process on transaction type
    __private.types[trs.type].process.call(self, trs, sender, (err, transaction) => {
        if (err) {
            return setImmediate(cb, err);
        }
        return setImmediate(cb, null, transaction);
    });
};

Transaction.prototype.newProcess = (trs, sender) => {
    // Check transaction type
    if (!__private.types[trs.type]) {
        throw new Error(`Unknown transaction type ${trs.type}`);
    }

    // Check sender
    if (!sender) {
        throw new Error('Missing sender');
    }

    trs.senderId = sender.address;

    const txId = self.getId(trs);

    if (trs.id && trs.id !== txId) {
        throw new Error('Invalid transaction id');
    }
};

Transaction.prototype.getAccountStatus = (trs, cb) => {
    self.scope.db.one(sqlAccount.checkAccountStatus, {
        senderId: trs.senderId
    }).then((row) => {
        if (row.status === 0) {
            return setImmediate(cb, 'Invalid transaction : account disabled');
        }
        return setImmediate(cb, null, row.status);
    }).catch((err) => {
        self.scope.logger.error(err.stack);
        return setImmediate(cb, 'Transaction#checkAccountStatus error');
    });
};

/**
 * Validates transaction fields.
 * @param {transaction} trs
 * @param {account} sender
 * @param {account} requester
 * @param {function} cb
 * @return {setImmediateCallback} validation errors | trs
 */
Transaction.prototype.verifyFields = ({ trs, sender, requester = {}, cb }) => {
    let valid = false;
    let err = null;

    // Check sender
    if (!sender) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.SENDER) {
            return setImmediate(cb, 'Missing sender');
        }
        self.scope.logger.error('Transaction sender error');
    }

    // Check transaction type
    if (!__private.types[trs.type]) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.TYPE) {
            return setImmediate(cb, `Unknown transaction type ${trs.type}`);
        }
        self.scope.logger.error('Transaction error type');
    }

    // Check for missing sender second signature
    if (!trs.requesterPublicKey &&
        sender.secondSignature &&
        !trs.signSignature &&
        trs.blockId !== self.scope.genesisblock.block.id
    ) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.SECOND_SIGNATURE) {
            return setImmediate(cb, 'Missing sender second signature');
        }
        self.scope.logger.error('Missing sender second signature');
    }

    // If second signature provided, check if sender has one enabled
    if (!trs.requesterPublicKey && !sender.secondSignature && (trs.signSignature && trs.signSignature.length > 0)) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.SENDER_SECOND_SIGNATURE) {
            return setImmediate(cb, 'Sender does not have a second signature');
        }
        self.scope.logger.error('Sender does not have a second signature');
    }

    // Check for missing requester second signature
    if (trs.requesterPublicKey && requester.secondSignature && !trs.signSignature) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.REQUEST_SECOND_SIGNATURE) {
            return setImmediate(cb, 'Missing requester second signature');
        }
        self.scope.logger.error('Missing requester second signature');
    }

    // If second signature provided, check if requester has one enabled
    if (trs.requesterPublicKey && !requester.secondSignature && (trs.signSignature && trs.signSignature.length > 0)) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.CHECKING_REQUEST_SECOND_SIGNATURE) {
            return setImmediate(cb, 'Requester does not have a second signature');
        }
        self.scope.logger.error('Requester does not have a second signature');
    }

    // Check sender public key
    if (
        sender.publicKey && sender.publicKey !== trs.senderPublicKey &&
        trs.height > constants.MASTER_NODE_MIGRATED_BLOCK
    ) {
        err = ['Invalid sender public key:', trs.senderPublicKey, 'expected:', sender.publicKey].join(' ');
        if (constants.TRANSACTION_VALIDATION_ENABLED.SENDER_PUBLIC_KEY) {
            if (exceptions.senderPublicKey.indexOf(trs.id) > -1) {
                self.scope.logger.debug(err);
                self.scope.logger.debug(JSON.stringify(trs));
            } else {
                return setImmediate(cb, err);
            }
        } else {
            self.scope.logger.error('Sender public key error');
        }
    }

    // Check sender is not genesis account unless block id equals genesis
    if (
        [exceptions.genesisPublicKey.mainnet, exceptions.genesisPublicKey.testnet].indexOf(sender.publicKey) !== -1
        && trs.blockId !== self.scope.genesisblock.block.id
    ) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.SENDER_GENESIS_ACCOUNT) {
            return setImmediate(cb, 'Invalid sender. Can not send from genesis account');
        }
        self.scope.logger.error('Invalid sender. Can not send from genesis account');
    }

    // Check sender address
    if (String(trs.senderId).toUpperCase() !== String(sender.address).toUpperCase()) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.SENDER_ADDRESS) {
            return setImmediate(cb, 'Invalid sender address');
        }
        self.scope.logger.error('Invalid sender address');
    }

    // Determine multisignatures from sender or transaction asset
    const multisignatures = sender.multisignatures || sender.u_multisignatures || [];
    if (multisignatures.length === 0) {
        if (trs.asset && trs.asset.multisignature && trs.asset.multisignature.keysgroup) {
            for (let i = 0; i < trs.asset.multisignature.keysgroup.length; i++) {
                const key = trs.asset.multisignature.keysgroup[i];

                if (!key || typeof key !== 'string') {
                    if (constants.TRANSACTION_VALIDATION_ENABLED.KEYSGROUP_MEMBER) {
                        return setImmediate(cb, 'Invalid member in keysgroup');
                    }
                    self.scope.logger.error('Invalid member in keysgroup');
                }

                multisignatures.push(key.slice(1));
            }
        }
    }

    // Check requester public key
    if (trs.requesterPublicKey) {
        multisignatures.push(trs.senderPublicKey);

        if (sender.multisignatures.indexOf(trs.requesterPublicKey) < 0) {
            if (constants.TRANSACTION_VALIDATION_ENABLED.MULTISIGNATURE_GROUP) {
                return setImmediate(cb, 'Account does not belong to multisignature group');
            }
            self.scope.logger.error('Account does not belong to multisignature group');
        }
    }

    // Verify signature
    try {
        valid = self.verifySignature(trs, (trs.requesterPublicKey || trs.senderPublicKey), trs.signature);
    } catch (e) {
        self.scope.logger.error(e.stack);
        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_SIGNATURE) {
            return setImmediate(cb, e.toString());
        }
        self.scope.logger.error('Transaction verify error');
    }

    if (!valid) {
        err = 'Failed to verify signature';

        if (exceptions.signatures.indexOf(trs.id) > -1) {
            self.scope.logger.debug(err);
            self.scope.logger.debug(JSON.stringify(trs));
            valid = true;
            err = null;
        } else {
            if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_SIGNATURE) {
                return setImmediate(cb, err);
            }
            self.scope.logger.error('Transaction verify error');
        }
    }

    // Verify second signature
    if (requester.secondSignature || sender.secondSignature) {
        try {
            valid = self.verifySecondSignature(
                trs,
                (requester.secondPublicKey || sender.secondPublicKey),
                trs.signSignature
            );
        } catch (e) {
            if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_SECOND_SIGNATURE) {
                return setImmediate(cb, e.toString());
            }
            self.scope.logger.error('Transaction verify second signature error');
        }

        if (!valid) {
            if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_SECOND_SIGNATURE) {
                return setImmediate(cb, 'Failed to verify second signature');
            }
            self.scope.logger.error('Failed to verify second signature');
        }
    }

    // Check that signatures are unique
    if (trs.signatures && trs.signatures.length) {
        const signatures = trs.signatures.reduce((p, c) => {
            if (p.indexOf(c) < 0) {
                p.push(c);
            }
            return p;
        }, []);

        if (signatures.length !== trs.signatures.length) {
            if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_SIGNATURE_UNIQUE) {
                return setImmediate(cb, 'Encountered duplicate signature in transaction');
            }
            self.scope.logger.error('Encountered duplicate signature in transaction');
        }
    }

    // Verify multisignatures
    if (trs.signatures) {
        for (let d = 0; d < trs.signatures.length; d++) {
            valid = false;

            for (let s = 0; s < multisignatures.length; s++) {
                if (trs.requesterPublicKey && multisignatures[s] === trs.requesterPublicKey) {
                    continue;
                }

                if (self.verifySignature(trs, multisignatures[s], trs.signatures[d])) {
                    valid = true;
                }
            }

            if (!valid) {
                if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_MULTISIGNATURE) {
                    return setImmediate(cb, 'Failed to verify multisignature');
                }
                self.scope.logger.error('Failed to verify multisignature');
            }
        }
    }

    // Check amount
    if (
        trs.amount < 0 ||
        trs.amount > constants.totalAmount ||
        String(trs.amount).indexOf('.') >= 0 ||
        trs.amount.toString().indexOf('e') >= 0
    ) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_AMOUNT) {
            return setImmediate(cb, 'Invalid transaction amount');
        }
        self.scope.logger.error('Invalid transaction amount');
    }

    // Check timestamp
    if (slots.getSlotNumber(trs.timestamp) > slots.getSlotNumber()) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_TIMESTAMP) {
            return setImmediate(cb, 'Invalid transaction timestamp. Timestamp is in the future');
        }
        self.scope.logger.error('Invalid transaction timestamp. Timestamp is in the future');
    }

    setImmediate(cb);
};

Transaction.prototype.newVerifyFields = ({ trs, sender }) => {
    let valid = false;
    let err = null;

    // Check sender
    if (!sender) {
        throw new Error('Missing sender');
    }

    // Check transaction type
    if (!__private.types[trs.type]) {
        throw new Error(`Unknown transaction type ${trs.type}`);
    }

    // Check for missing sender second signature
    if (!trs.requesterPublicKey &&
        sender.secondSignature &&
        !trs.signSignature &&
        trs.blockId !== self.scope.genesisblock.block.id
    ) {
        throw new Error('Missing sender second signature');
    }

    // If second signature provided, check if sender has one enabled
    if (!trs.requesterPublicKey && !sender.secondSignature && (trs.signSignature && trs.signSignature.length > 0)) {
        throw new Error('Sender does not have a second signature');
    }

    // Check for missing requester second signature
    // if (trs.requesterPublicKey && requester.secondSignature && !trs.signSignature) {
    //     throw new Error('Missing requester second signature');
    // }

    // If second signature provided, check if requester has one enabled
    // if (trs.requesterPublicKey && !requester.secondSignature &&
    //     (trs.signSignature && trs.signSignature.length > 0)) {
    //     throw new Error('Requester does not have a second signature');
    // }

    // Check sender public key
    if (
        sender.publicKey && sender.publicKey !== trs.senderPublicKey &&
        trs.height > constants.MASTER_NODE_MIGRATED_BLOCK
    ) {
        err = ['Invalid sender public key:', trs.senderPublicKey, 'expected:', sender.publicKey].join(' ');
        if (exceptions.senderPublicKey.indexOf(trs.id) > -1) {
            self.scope.logger.debug(err);
            self.scope.logger.debug(JSON.stringify(trs));
        } else {
            throw new Error(err);
        }
    }

    // Check sender is not genesis account unless block id equals genesis
    if (
        [exceptions.genesisPublicKey.mainnet, exceptions.genesisPublicKey.testnet].indexOf(sender.publicKey) !== -1
        && trs.blockId !== self.scope.genesisblock.block.id
    ) {
        throw new Error('Invalid sender. Can not send from genesis account');
    }

    // Check sender address
    if (String(trs.senderId).toUpperCase() !== String(sender.address).toUpperCase()) {
        throw new Error('Invalid sender address');
    }

    // Determine multisignatures from sender or transaction asset
    const multisignatures = sender.multisignatures || sender.u_multisignatures || [];
    if (multisignatures.length === 0) {
        if (trs.asset && trs.asset.multisignature && trs.asset.multisignature.keysgroup) {
            for (let i = 0; i < trs.asset.multisignature.keysgroup.length; i++) {
                const key = trs.asset.multisignature.keysgroup[i];

                if (!key || typeof key !== 'string') {
                    throw new Error('Invalid member in keysgroup');
                }

                multisignatures.push(key.slice(1));
            }
        }
    }

    // Check requester public key
    // if (trs.requesterPublicKey) {
    //     multisignatures.push(trs.senderPublicKey);
    //
    //     if (sender.multisignatures.indexOf(trs.requesterPublicKey) < 0) {
    //         throw new Error('Account does not belong to multisignature group');
    //     }
    // }

    // Verify signature
    valid = self.verifySignature(trs, trs.senderPublicKey, trs.signature);

    if (!valid) {
        throw new Error('Failed to verify signature');
    }

    // Verify second signature
    if (sender.secondSignature) {
        valid = self.verifySecondSignature(trs, sender.secondPublicKey, trs.signSignature);
        if (!valid) {
            throw new Error('Failed to verify second signature');
        }
    }

    // Check that signatures are unique
    if (trs.signatures && trs.signatures.length) {
        const signatures = trs.signatures.reduce((p, c) => {
            if (p.indexOf(c) < 0) {
                p.push(c);
            }
            return p;
        }, []);

        if (signatures.length !== trs.signatures.length) {
            throw new Error('Encountered duplicate signature in transaction');
        }
    }

    // Verify multisignatures
    if (trs.signatures) {
        for (let d = 0; d < trs.signatures.length; d++) {
            valid = false;

            for (let s = 0; s < multisignatures.length; s++) {
                if (trs.requesterPublicKey && multisignatures[s] === trs.requesterPublicKey) {
                    continue;
                }

                if (self.verifySignature(trs, multisignatures[s], trs.signatures[d])) {
                    valid = true;
                }
            }

            if (!valid) {
                throw new Error('Failed to verify multisignature');
            }
        }
    }

    // Check amount
    if (
        trs.amount < 0 ||
        trs.amount > constants.totalAmount ||
        String(trs.amount).indexOf('.') >= 0 ||
        trs.amount.toString().indexOf('e') >= 0
    ) {
        throw new Error('Invalid transaction amount');
    }

    // Check timestamp
    if (slots.getSlotNumber(trs.timestamp) > slots.getSlotNumber()) {
        throw new Error('Invalid transaction timestamp. Timestamp is in the future');
    }
};


/**
 * Validates new transaction.
 * Calls `verify` based on transaction type (see privateTypes)
 * @see privateTypes
 * @implements {getId}
 * @param {transaction} trs
 * @param {account} sender
 * @param {account} requester
 * @param {boolean} checkExists - Check if transaction already exists in database
 * @param {function} cb
 * @return {setImmediateCallback} validation errors | trs
 */
Transaction.prototype.verify = ({ trs, sender, requester = {}, checkExists = false, cb }) => {
    const verifyTransactionTypes = (transaction, innerSender, verifyTransactionTypesCb) => {
        __private.types[trs.type].verify.call(self, transaction, innerSender, (err) => {
            if (err) {
                if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_TYPE) {
                    return setImmediate(verifyTransactionTypesCb, err);
                }
                self.scope.logger.error('Transaction types error');
            }
            return setImmediate(verifyTransactionTypesCb);
        });
    };

    async.series([
        seriesCb => self.verifyFields({ trs, sender, requester, cb: seriesCb }),
        (seriesCb) => {
            if (checkExists) {
                self.checkConfirmed(trs, (checkConfirmedErr, isConfirmed) => {
                    if (checkConfirmedErr) {
                        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_CONFIRMED) {
                            return setImmediate(seriesCb, checkConfirmedErr);
                        }
                        self.scope.logger.error('Transaction confirm error');
                    }

                    if (isConfirmed) {
                        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_CONFIRMED) {
                            return setImmediate(seriesCb, `Transaction is already confirmed: ${trs.id}`);
                        }
                        self.scope.logger.error('Transaction confirm error');
                    }

                    return verifyTransactionTypes(trs, sender, seriesCb);
                });
            } else {
                return verifyTransactionTypes(trs, sender, seriesCb);
            }
        },
    ], err => setImmediate(cb, err));
};

Transaction.prototype.newVerify = async ({ trs, sender, checkExists = false }) => {
    try {
        self.newProcess(trs, sender);
    } catch (e) {
        throw e;
    }

    try {
        await self.newVerifyFields({ trs, sender });
    } catch (e) {
        throw e;
    }

    if (checkExists) {
        const isConfirmed = await self.newCheckConfirmed(trs);
        if (isConfirmed) {
            throw new Error(`Transaction is already confirmed: ${trs.id}`);
        }
    }
    try {
        await __private.types[trs.type].newVerify.call(self, trs, sender);
    } catch (e) {
        throw e;
    }
};

/**
 * Validates unconfirmed transaction.
 * Calls `verifyUnconfirmed` based on trs type
 * @param {transaction} trs
 * @param {account} sender
 * @param {account} requester
 * @param {function} cb
 * @return {setImmediateCallback} validation errors | trs
 */
Transaction.prototype.verifyUnconfirmed = ({ trs, sender, cb }) => {
    const calculateFee = __private.types[trs.type].calculateUnconfirmedFee || __private.types[trs.type].calculateFee;
    const fee = calculateFee.call(self, trs, sender) || 0;
    if (trs.type !== transactionTypes.REFERRAL &&
        !(trs.type === transactionTypes.STAKE && trs.stakedAmount < 0) &&
        (!fee || trs.fee !== fee)
    ) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_FEE) {
            return setImmediate(cb, 'Invalid transaction fee');
        }
        self.scope.logger.error('Invalid transaction fee');
    }

    // Check sender not able to do transaction on froze amount
    const amount = new bignum(trs.amount.toString()).plus(trs.fee.toString());

    const senderBalance = self.checkBalance(amount, true, trs, sender);

    if (senderBalance.exceeded) {
        if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_SENDER_BALANCE) {
            return setImmediate(cb, senderBalance.error);
        }
        self.scope.logger.error('Sender unconfirmed balance error');
    }

    __private.types[trs.type].verifyUnconfirmed.call(self, trs, sender, (err) => {
        if (err) {
            if (constants.TRANSACTION_VALIDATION_ENABLED.VERIFY_TRANSACTION_TYPE) {
                return setImmediate(cb, err);
            }
            self.scope.logger.error('Transaction types error');
        }
        return setImmediate(cb);
    });
};

Transaction.prototype.newVerifyUnconfirmed = async ({ trs, sender }) => {
    const calculateFee = __private.types[trs.type].calculateUnconfirmedFee || __private.types[trs.type].calculateFee;
    const fee = calculateFee.call(self, trs, sender) || 0;
    if (trs.type !== transactionTypes.REFERRAL &&
        !(trs.type === transactionTypes.STAKE && trs.stakedAmount < 0) &&
        (!fee || trs.fee !== fee)
    ) {
        throw new Error('Invalid transaction fee');
    }

    // Check sender not able to do transaction on froze amount
    const amount = new bignum(trs.amount.toString()).plus(trs.fee.toString());

    const senderBalance = self.checkBalance(amount, true, trs, sender);

    if (senderBalance.exceeded) {
        throw new Error(senderBalance.error);
    }

    await __private.types[trs.type].newVerifyUnconfirmed.call(self, trs, sender, (err) => {
        if (err) {
            throw err;
        }
    });
};

/**
 * Verifies signature for valid transaction type
 * @implements {getBytes}
 * @implements {verifyBytes}
 * @param {transaction} trs
 * @param {publicKey} publicKey
 * @param {signature} signature
 * @return {boolean}
 * @throws {error}
 */
Transaction.prototype.verifySignature = (trs, publicKey, signature) => {
    if (!signature) {
        return false;
    }
    self.scope.logger.trace(`Transaction ${JSON.stringify(trs)}`);
    self.scope.logger.trace(`publicKey ${JSON.stringify(publicKey)}`);
    self.scope.logger.trace(`signature ${JSON.stringify(signature)}`);
    const bytes = self.getBytes(trs, true, true);
    self.scope.logger.trace(`Bytes ${JSON.stringify(bytes)}`);
    let verify = self.verifyBytes(bytes, publicKey, signature);
    // TODO add block limit
    if (!verify) {
        verify = self.verifyBytes(bytes, constants.PRE_ORDER_PUBLIC_KEY, signature);
    }


    self.scope.logger.debug(`verify ${JSON.stringify(verify)}`);
    return verify;
};

/**
 * Verifies second signature for valid transaction type
 * @implements {getBytes}
 * @implements {verifyBytes}
 * @param {transaction} trs
 * @param {publicKey} publicKey
 * @param {signature} signature
 * @return {boolean}
 * @throws {error}
 */
Transaction.prototype.verifySecondSignature = (trs, publicKey, signature) => {
    if (!signature) {
        return false;
    }

    let res;

    try {
        const bytes = self.getBytes(trs, false, true);
        res = self.verifyBytes(bytes, publicKey, signature);
    } catch (e) {
        throw e;
    }

    return res;
};

/**
 * Verifies hash, publicKey and signature.
 * @implements {crypto.createHash}
 * @implements {scope.ed.verify}
 * @param {Array} bytes
 * @param {publicKey} publicKey
 * @param {signature} signature
 * @return {boolean} verified hash, signature and publicKey
 * @throws {error}
 */
Transaction.prototype.verifyBytes = (bytes, publicKey, signature) => {
    const hash = crypto.createHash('sha256').update(bytes).digest();
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    return sodium.crypto_sign_verify_detached(signatureBuffer, hash, publicKeyBuffer);
};

/**
 * Merges account into sender address, Calls `apply` based on trs type (privateTypes).
 * @see privateTypes
 * @implements {checkBalance}
 * @implements {account.merge}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} for errors | cb
 */
Transaction.prototype.apply = (trs, block, sender, cb) => {
    if (!self.ready(trs, sender)) {
        return setImmediate(cb, 'Transaction is not ready');
    }

    let amount = new bignum(trs.amount.toString()).plus(trs.fee.toString());

    amount = amount.toNumber();

    self.scope.logger.trace('Logic/Transaction->apply', {
        sender: sender.address, balance: -amount, blockId: block.id, round: modules.rounds.calc(block.height)
    });
    self.scope.account.merge(sender.address, {
        balance: -amount,
        blockId: block.id,
        round: modules.rounds.calc(block.height)
    }, (err, mergedSender) => {
        if (err) {
            return setImmediate(cb, err);
        }
        /**
         * calls apply for Transfer, Signature, Delegate, Vote, Multisignature,
         * DApp, InTransfer or OutTransfer.
         */
        __private.types[trs.type].apply.call(self, trs, block, mergedSender, (applyErr) => {
            if (applyErr) {
                self.scope.account.merge(mergedSender.address, {
                    balance: amount,
                    blockId: block.id,
                    round: modules.rounds.calc(block.height)
                }, mergeErr => setImmediate(cb, mergeErr || applyErr));
            } else {
                return setImmediate(cb);
            }
        });
    });
};

Transaction.prototype.newApply = async (trs, block, sender) => {
    const amount = trs.amount + trs.fee;

    self.scope.logger.trace('Logic/Transaction->apply', {
        sender: sender.address, balance: -amount, blockId: block.id, round: modules.rounds.calc(block.height)
    });

    const mergedSender = await self.scope.account.asyncMerge(sender.address, {
        balance: -amount,
        blockId: block.id,
        round: modules.rounds.calc(block.height)
    });
    try {
        await (new Promise((resolve, reject) => {
            __private.types[trs.type].apply.call(self, trs, block, mergedSender, (err) => {
                if (err) {
                    reject(err);
                }
                trs.status = TransactionStatus.APPLIED;
                resolve();
            });
        }));
    } catch (e) {
        await self.scope.account.asyncMerge(mergedSender.address, {
            balance: amount,
            blockId: block.id,
            round: modules.rounds.calc(block.height)
        });
        trs.status = TransactionStatus.DECLINED;
        self.scope.logger.error(`[Logic/Transaction][apply]: ${e}`);
        self.scope.logger.error(`[Logic/Transaction][apply][stack]: ${e.stack}`);
    }
    self.scope.logger.debug(`[Logic/Transaction][apply]: transaction applied ${JSON.stringify(trs)}`);
};

/**
 * Merges account into sender address, Calls `undo` based on trs type (privateTypes).
 * @see privateTypes
 * @implements {bignum}
 * @implements {account.merge}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} for errors | cb
 */
Transaction.prototype.undo = (trs, block, sender, cb) => {
    const amount = new bignum(trs.amount.toString()).plus(trs.fee.toString());

    self.scope.logger.trace('Logic/Transaction->undo', {
        sender: sender.address, balance: amount, blockId: block.id, round: modules.rounds.calc(block.height)
    });
    self.scope.account.merge(sender.address, {
        balance: amount,
        blockId: block.id,
        round: modules.rounds.calc(block.height)
    }, (err, mergedSender) => {
        if (err) {
            return setImmediate(cb, err);
        }

        __private.types[trs.type].undo.call(self, trs, block, mergedSender, (undoError) => {
            if (undoError) {
                self.scope.account.merge(mergedSender.address, {
                    balance: -amount,
                    blockId: block.id,
                    round: modules.rounds.calc(block.height)
                }, mergedError => setImmediate(cb, mergedError || undoError));
            } else {
                return setImmediate(cb);
            }
        });
    });
};

/**
 * Checks unconfirmed sender balance. Merges account into sender address with
 * unconfirmed balance negative amount.
 * Calls `applyUnconfirmed` based on trs type (privateTypes). If error merge
 * account with amount.
 * @see privateTypes
 * @implements {bignum}
 * @implements {checkBalance}
 * @implements {account.merge}
 * @param {transaction} trs
 * @param {account} sender
 * @param {account} requester
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} for errors | cb
 */
Transaction.prototype.applyUnconfirmed = (trs, sender, requester, cb) => {
    if (typeof requester === 'function') {
        cb = requester;
    }
    let amount = new bignum(trs.amount.toString()).plus(trs.fee.toString());

    amount = amount.toNumber();

    if (trs.type === transactionTypes.STAKE) {
        self.scope.account.merge(sender.address, {
            u_balance: -amount,
            u_totalFrozeAmount: trs.stakedAmount
        }, (err, mergedSender) => {
            if (err) {
                return setImmediate(cb, err);
            }

            __private.types[trs.type].applyUnconfirmed.call(self, trs, mergedSender, (applyUnconfirmedError) => {
                if (applyUnconfirmedError) {
                    self.scope.account.merge(mergedSender.address, {
                        u_balance: amount,
                        u_totalFrozeAmount: -trs.stakedAmount
                    }, mergedError => setImmediate(cb, mergedError || applyUnconfirmedError));
                } else {
                    return setImmediate(cb);
                }
            });
        });
    } else {
        self.scope.account.merge(sender.address, { u_balance: -amount }, (err, mergedSender) => {
            if (err) {
                return setImmediate(cb, err);
            }

            __private.types[trs.type].applyUnconfirmed.call(self, trs, mergedSender, (applyUnconfirmedError) => {
                if (applyUnconfirmedError) {
                    self.scope.account.merge(
                        mergedSender.address,
                        { u_balance: amount },
                        mergeError => setImmediate(cb, mergeError || applyUnconfirmedError)
                    );
                } else {
                    return setImmediate(cb);
                }
            });
        });
    }
};

Transaction.prototype.newApplyUnconfirmed = async (trs, sender) => {
    const amount = trs.amount + trs.fee;

    const mergedSender = await self.scope.account.asyncMerge(
        sender.address,
        { u_balance: -amount, u_totalFrozeAmount: trs.stakedAmount }
    );
    try {
        await (new Promise((resolve, reject) => {
            __private.types[trs.type].applyUnconfirmed.call(self, trs, mergedSender, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        }));
    } catch (err) {
        await self.scope.account.asyncMerge(
            mergedSender.address,
            { u_balance: amount, u_totalFrozeAmount: -trs.stakedAmount }
        );
        throw err;
    }
};

/**
 * Merges account into sender address with unconfirmed balance trs amount.
 * Calls `undoUnconfirmed` based on trs type (privateTypes). If error merge
 * account with megative amount.
 * @see privateTypes
 * @implements {bignum}
 * @implements {account.merge}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} for errors | cb
 */
Transaction.prototype.undoUnconfirmed = (trs, sender, cb) => {
    const amount = (new bignum(trs.amount.toString())).plus(trs.fee.toString()).toNumber();

    if (trs.type === transactionTypes.STAKE) {
        self.scope.account.merge(sender.address, {
            u_balance: amount,
            u_totalFrozeAmount: -trs.stakedAmount
        }, (err, mergedSender) => {
            if (err) {
                return setImmediate(cb, err);
            }

            __private.types[trs.type].undoUnconfirmed.call(self, trs, mergedSender, (undoUnconfirmedError) => {
                if (undoUnconfirmedError) {
                    self.scope.account.merge(mergedSender.address, {
                        u_balance: -amount,
                        u_totalFrozeAmount: trs.stakedAmount
                    }, mergeError => setImmediate(cb, mergeError || undoUnconfirmedError));
                } else {
                    return setImmediate(cb);
                }
            });
        });
    } else {
        self.scope.account.merge(sender.address, { u_balance: amount }, (err, mergedSender) => {
            if (err) {
                return setImmediate(cb, err);
            }

            __private.types[trs.type].undoUnconfirmed.call(self, trs, mergedSender, (undoUnconfirmedError) => {
                if (undoUnconfirmedError) {
                    self.scope.account.merge(
                        mergedSender.address,
                        { u_balance: -amount },
                        mergeError => setImmediate(cb, mergeError || undoUnconfirmedError)
                    );
                } else {
                    return setImmediate(cb);
                }
            });
        });
    }
};

Transaction.prototype.newUndoUnconfirmed = async (trs) => {
    const amount = trs.amount + trs.fee;

    const mergedSender = await self.scope.account.asyncMerge(
        trs.senderId,
        { u_balance: amount, u_totalFrozeAmount: -trs.stakedAmount }
    );
    try {
        await (new Promise((resolve, reject) => {
            __private.types[trs.type].undoUnconfirmed.call(self, trs, mergedSender, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        }));
    } catch (err) {
        self.scope.logger.error(`[LogicTransaction][newUndoUnconfirmed] ${err}`);
        self.scope.logger.error(`[LogicTransaction][newUndoUnconfirmed][stack] ${err.stack}`);
        await self.scope.account.asyncMerge(
            trs.senderId,
            { u_balance: -amount, u_totalFrozeAmount: trs.stakedAmount },
        );
        throw err;
    }
};

Transaction.prototype.calcUndoUnconfirmed = (trs, sender) => {
    sender.u_balance -= trs.amount + trs.fee;
    sender.u_totalFrozeAmount -= trs.stakedAmount;

    __private.types[trs.type].calcUndoUnconfirmed(trs, sender);
};

Transaction.prototype.dbTable = 'trs';

Transaction.prototype.dbFields = [
    'id',
    'blockId',
    'type',
    'timestamp',
    'senderPublicKey',
    'requesterPublicKey',
    'senderId',
    'recipientId',
    'amount',
    'stakedAmount',
    'stakeId',
    'groupBonus',
    'fee',
    'signature',
    'signSignature',
    'signatures',
    'trsName',
    'reward',
    'salt'
];

/**
 * Creates db trs object transaction. Calls `dbSave` based on trs type (privateTypes).
 * @see privateTypes
 * @param {transaction} trs
 * @return {Object[]} dbSave result + created object
 * @throws {String|error} error string | catch error
 */
Transaction.prototype.dbSave = async (trs) => {
    if (!__private.types[trs.type]) {
        throw `Unknown transaction type ${trs.type}`;
    }

    let senderPublicKey;
    let signature;
    let signSignature;
    let requesterPublicKey;

    try {
        senderPublicKey = trs.senderPublicKey;
        signature = trs.signature;
        signSignature = trs.signSignature ? trs.signSignature : null;
        requesterPublicKey = trs.requesterPublicKey ? trs.requesterPublicKey : null;
    } catch (e) {
        throw e;
    }

    // FIXME ?
    if ((trs.type === transactionTypes.STAKE) && trs.freezedAmount > 0) {
        trs.amount = trs.freezedAmount;
    }

    const promises = [{
        table: self.dbTable,
        fields: self.dbFields,
        values: {
            id: trs.id,
            blockId: trs.blockId,
            type: trs.type,
            timestamp: trs.timestamp,
            senderPublicKey,
            requesterPublicKey,
            senderId: trs.senderId,
            recipientId: trs.recipientId || null,
            amount: trs.amount,
            stakedAmount: trs.stakedAmount,
            stakeId: trs.stakeId || null,
            groupBonus: trs.groupBonus,
            fee: trs.fee,
            signature,
            signSignature,
            signatures: trs.signatures ? trs.signatures.join(',') : null,
            trsName: trs.trsName,
            reward: trs.reward,
            salt: trs.salt
        }
    }];

    const promise = await __private.types[trs.type].dbSave(trs);

    if (promise) {
        promises.push(promise);
    }

    return promises;
};

/**
 * Calls `afterSave` based on trs type (privateTypes).
 * @see privateTypes
 * @param {transaction} trs
 * @param {function} cb
 * @return {setImmediateCallback} error string | cb
 */
Transaction.prototype.afterSave = async (trs) => {
    if (trs.type === transactionTypes.STAKE) {
        const stakeOrder = await self.scope.db.one(sqlFroging.getStakeById, {
            id: trs.id
        });
        if (stakeOrder) {
            await utils.addDocument({
                index: 'stake_orders',
                type: 'stake_orders',
                body: stakeOrder,
                id: stakeOrder.id
            });
        } else {
            throw 'couldn\'t add document to index stake_orders in the ElasticSearch';
        }
        // Stake order event
        self.scope.network.io.sockets.emit('stake/change', null);
    }

    const txType = __private.types[trs.type];

    if (!txType) {
        throw `Unknown transaction type ${trs.type}`;
    }
    const lastTransaction = await self.scope.db.one(sql.getTransactionById, { id: trs.id });
    await utils.addDocument({
        index: 'trs',
        type: 'trs',
        body: lastTransaction,
        id: lastTransaction.id
    });
    if (typeof txType.afterSave === 'function') {
        return txType.afterSave.call(self, trs);
    }
};

/**
 * @typedef {Object} transaction
 * @property {string} id
 * @property {number} height
 * @property {string} blockId
 * @property {number} type
 * @property {number} timestamp
 * @property {publicKey} senderPublicKey
 * @property {publicKey} requesterPublicKey
 * @property {string} senderId
 * @property {string} recipientId
 * @property {number} amount
 * @property {number} fee
 * @property {string} signature
 * @property {string} signSignature
 * @property {Object} asset
 * @property {multisignature} [asset.multisignature]
 * @property {signature} [asset.signature]
 * @property {dapp} [asset.dapp]
 * @property {Object} [asset.outTransfer] - Contains dappId and transactionId
 * @property {Object} [asset.inTransfer] - Contains dappId
 * @property {votes} [asset.votes] - Contains multiple votes to a transactionId
 *
 */
Transaction.prototype.schema = {
    id: 'Transaction',
    type: 'object',
    properties: {
        id: {
            type: 'string', format: 'hex', minLength: 1, maxLength: 64
        },
        height: {
            type: 'integer'
        },
        blockId: {
            type: 'string', format: 'hex', minLength: 1, maxLength: 64
        },
        type: {
            type: 'integer'
        },
        timestamp: {
            type: 'integer'
        },
        senderPublicKey: {
            type: 'string', format: 'publicKey'
        },
        requesterPublicKey: {
            type: 'string', format: 'publicKey'
        },
        senderId: {
            type: 'string', format: 'address', minLength: 1, maxLength: 25
        },
        recipientId: {
            type: 'string', format: 'address', minLength: 1, maxLength: 25
        },
        amount: {
            type: 'integer', minimum: 0, maximum: constants.totalAmount
        },
        fee: {
            type: 'integer', minimum: 0, maximum: constants.totalAmount
        },
        signature: {
            type: 'string', format: 'signature'
        },
        signSignature: {
            type: 'string', format: 'signature'
        },
        asset: {
            type: 'object'
        }
    },
    required: ['type', 'timestamp', 'senderPublicKey', 'signature']
};

Transaction.prototype.Referschema = {
    id: 'Transaction',
    type: 'object',
    properties: {
        id: {
            type: 'string', format: 'hex', minLength: 1, maxLength: 64
        },
        height: {
            type: 'integer'
        },
        blockId: {
            type: 'string', format: 'hex', minLength: 1, maxLength: 64
        },
        type: {
            type: 'integer'
        },
        timestamp: {
            type: 'integer'
        },
        senderPublicKey: {
            type: 'string', format: 'publicKey'
        },
        requesterPublicKey: {
            type: 'string', format: 'publicKey'
        },
        senderId: {
            type: 'string', format: 'address', minLength: 1, maxLength: 25
        },
        recipientId: {
            type: 'string', format: 'address', minLength: 1, maxLength: 25
        },
        amount: {
            type: 'integer', minimum: 0, maximum: constants.totalAmount
        },
        fee: {
            type: 'integer', minimum: 0, maximum: constants.totalAmount
        },
        signature: {
            type: 'string', format: 'signature'
        },
        signSignature: {
            type: 'string', format: 'signature'
        },
        asset: {
            type: 'object'
        }
    },
    required: ['type', 'timestamp', 'senderPublicKey', 'signature']
};

/**
 * Calls `objectNormalize` based on trs type (privateTypes).
 * @see privateTypes
 * @implements {scope.schema.validate}
 * @param {transaction} trs
 * @return {error|transaction} error string | trs normalized
 * @throws {string} error message
 */
Transaction.prototype.objectNormalize = (trs) => {
    if (!__private.types[trs.type]) {
        throw `Unknown transaction type ${trs.type}`;
    }

    Object.keys(trs).forEach((key) => {
        if (trs[key] === null || typeof trs[key] === 'undefined') {
            delete trs[key];
        }
    });

    trs.fee = trs.fee || 0;

    const report = self.scope.schema.validate(trs, Transaction.prototype.schema);

    // schemaValidator
    if (!report) {
        throw `Failed to validate transaction schema: ${self.scope.schema.getLastErrors()
            .map(err => err.message).join(', ')}`;
    }

    try {
        trs = __private.types[trs.type].objectNormalize.call(self, trs);
    } catch (e) {
        throw e;
    }

    return trs;
};

/**
 * Calls `dbRead` based on trs type (privateTypes) to add tr asset.
 * @see privateTypes
 * @param {Object} raw
 * @return {null|tx}
 * @throws {string} Unknown transaction type
 */
Transaction.prototype.dbRead = (raw) => {
    if (!raw.t_id) {
        return null;
    }
    const tx = {
        id: raw.t_id,
        height: raw.b_height,
        blockId: raw.b_id || raw.t_blockId,
        type: Number(raw.t_type),
        timestamp: Number(raw.t_timestamp),
        senderPublicKey: raw.t_senderPublicKey,
        requesterPublicKey: raw.t_requesterPublicKey,
        senderId: raw.t_senderId,
        recipientId: raw.t_recipientId,
        recipientPublicKey: raw.m_recipientPublicKey || null,
        amount: Number(raw.t_amount),
        stakedAmount: Number(raw.t_stakedAmount),
        stakeId: raw.t_stakeId,
        groupBonus: Number(raw.t_groupBonus),
        fee: Number(raw.t_fee),
        signature: raw.t_signature,
        signSignature: raw.t_signSignature,
        signatures: raw.t_signatures ? raw.t_signatures.split(',') : [],
        confirmations: Number(raw.confirmations),
        asset: {},
        trsName: raw.t_trsName,
        reward: raw.t_reward,
        pendingGroupBonus: raw.t_pendingGroupBonus,
        salt: raw.t_salt
    };

    if (!__private.types[tx.type]) {
        throw `Unknown transaction type ${tx.type}`;
    }

    const asset = __private.types[tx.type].dbRead.call(self, raw);

    if (asset) {
        tx.asset = extend(tx.asset, asset);
    }

    return tx;
};

// Events
/**
 * Binds input parameters to private variables modules.
 * @param {Object} __modules
 */
Transaction.prototype.bindModules = (__modules) => {
    self.scope.logger.trace('Logic/Transaction->bindModules');
    modules = {
        rounds: __modules.rounds
    };
};

// call add transaction API
Transaction.prototype.sendTransaction = (data, cb) => {
    const port = self.scope.config.app.port;
    const address = self.scope.config.address;

    request.put(`http://${address}:${port}/api/transactions/`, data, (error, transactionResponse) => {
        if (error) {
            return setImmediate(cb, error);
        }

        return setImmediate(cb, null, transactionResponse);
    });
};

// Export
module.exports = Transaction;
