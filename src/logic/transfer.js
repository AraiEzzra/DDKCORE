const constants = require('../helpers/constants.js');

// Private fields
let modules;
let self;

/**
 * Main transfer logic.
 * @memberof module:transactions
 * @class
 * @classdesc Main transfer logic.
 */
// Constructor
function Transfer() {
    self = this;
}

// Public methods
/**
 * Binds input parameters to private variable modules.
 * @param {Accounts} accounts
 * @param {Rounds} rounds
 */
Transfer.prototype.bind = function (accounts, rounds) {
    modules = {
        accounts,
        rounds,
    };
};

/**
 * Assigns data to transaction recipientId and amount.
 * @param {Object} data
 * @param {transaction} trs
 * @return {transaction} trs with assigned data
 */
Transfer.prototype.create = function (data, trs) {
    trs.recipientId = data.recipientId;
    trs.amount = data.amount;
    if (data.trsName) {
        trs.trsName = data.trsName;
    } else {
        trs.trsName = 'SEND';
    }
    return trs;
};
/**
 * Returns send fees from constants.
 * @param {transaction} trs
 * @param {account} sender
 * @return {number} fee
 */
Transfer.prototype.calculateFee = function (trs) {
    return (trs.amount * constants.fees.send) / 100;
};

/**
 * Verifies recipientId and amount greather than 0.
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} errors | trs
 */
Transfer.prototype.verify = function (trs, sender, cb) {
    if (!trs.recipientId) {
        if (constants.SEND_TRANSACTION_VALIDATION_ENABLED.RECIPIENT_ID) {
            return setImmediate(cb, 'Missing recipient');
        }
        library.logger.error('Missing recipient');
    }

    if (trs.amount <= 0) {
        if (constants.SEND_TRANSACTION_VALIDATION_ENABLED.AMOUNT) {
            return setImmediate(cb, 'Invalid transaction amount');
        }
        library.logger.error('Invalid transaction amount');
    }

    return setImmediate(cb, null, trs);
};

Transfer.prototype.verifyUnconfirmed = function (trs, sender, cb) {
    return setImmediate(cb);
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb, null, trs
 */
Transfer.prototype.process = function (trs, sender, cb) {
    return setImmediate(cb, null, trs);
};

/**
 * @param {transaction} trs
 * @return {null}
 */
Transfer.prototype.getBytes = function (trs) {
    return Buffer.from([]);
};

/**
 * Calls setAccountAndGet based on transaction recipientId and
 * mergeAccountAndGet with unconfirmed trs amount.
 * @implements {modules.accounts.setAccountAndGet}
 * @implements {modules.accounts.mergeAccountAndGet}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} error, cb
 */
Transfer.prototype.apply = function (trs, block, sender, cb) {
    modules.accounts.setAccountAndGet({ address: trs.recipientId }, (err) => {
        if (err) {
            return setImmediate(cb, err);
        }

        modules.accounts.mergeAccountAndGet({
            address: trs.recipientId,
            balance: trs.amount,
            blockId: block.id,
            round: modules.rounds.calc(block.height)
        }, errAccountGet => setImmediate(cb, errAccountGet));
    });
};

/**
 * Calls setAccountAndGet based on transaction recipientId and
 * mergeAccountAndGet with unconfirmed trs amount and balance negative.
 * @implements {modules.accounts.setAccountAndGet}
 * @implements {modules.accounts.mergeAccountAndGet}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} error, cb
 */
Transfer.prototype.undo = function (trs, block, sender, cb) {
    modules.accounts.setAccountAndGet({ address: trs.recipientId }, (err) => {
        if (err) {
            return setImmediate(cb, err);
        }

        modules.accounts.mergeAccountAndGet({
            address: trs.recipientId,
            balance: -trs.amount,
            blockId: block.id,
            round: modules.rounds.calc(block.height)
        }, err => setImmediate(cb, err));
    });
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Transfer.prototype.applyUnconfirmed = function (trs, sender, cb) {
    modules.accounts.setAccountAndGet({ address: trs.recipientId }, (err) => {
        if (err) {
            return setImmediate(cb, err);
        }

        modules.accounts.mergeAccountAndGet({
            address: trs.recipientId,
            u_balance: trs.amount,
        }, errAccountGet => setImmediate(cb, errAccountGet));
    });
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Transfer.prototype.undoUnconfirmed = function (trs, sender, cb) {
    modules.accounts.setAccountAndGet({ address: trs.recipientId }, (err) => {
        if (err) {
            return setImmediate(cb, err);
        }

        modules.accounts.mergeAccountAndGet({
            address: trs.recipientId,
            u_balance: -trs.amount,
        }, errAccountGet => setImmediate(cb, errAccountGet));
    });
};

/**
 * Deletes blockId from transaction
 * @param {transaction} trs
 * @return {transaction}
 */
Transfer.prototype.objectNormalize = function (trs) {
    delete trs.blockId;
    return trs;
};

/**
 * @param {Object} raw
 * @return {null}
 */
Transfer.prototype.dbRead = function () {
    return null;
};

/**
 * @param {transaction} trs
 * @return {null}
 */
Transfer.prototype.dbSave = function () {
    return null;
};

/**
 * Checks sender multisignatures and transaction signatures.
 * @param {transaction} trs
 * @param {account} sender
 * @return {boolean} True if transaction signatures greather than
 * sender multimin or there are not sender multisignatures.
 */
Transfer.prototype.ready = function (trs, sender) {
    if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
        if (!Array.isArray(trs.signatures)) {
            return false;
        }
        return trs.signatures.length >= sender.multimin;
    }
    return true;
};

// Export
module.exports = Transfer;

/** ************************************* END OF FILE ************************************ */
