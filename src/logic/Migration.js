const sql = require('../sql/referal_sql');

// Private fields
let modules,
    self;

/**
 * Main migration logic.
 *
 * @class
 * @classdesc Main migration logic.
 */
// Constructor
function Migration(logger, db, cb) {
    self = this;
    self.scope = {
        logger,
        db
    };

    if (cb) {
        return setImmediate(cb, null, this);
    }
}

// Public methods
/**
 * Binds input parameters to private variable modules.
 * @param {Accounts} accounts
 * @param {Rounds} rounds
 */
Migration.prototype.bind = function (accounts, rounds) {
    modules = {
        accounts,
        rounds,
    };
};

/**
 * Assigns data to transaction groupBonus, senderId, stakedAmount, public key and name.
 * @param {Object} data
 * @param {transaction} trs
 * @return {transaction} trs with assigned data
 */
Migration.prototype.create = function (data, trs) {
    trs.groupBonus = data.groupBonus;
    trs.senderId = data.sender.address;
    trs.stakedAmount = data.totalFrozeAmount;
    // trs.balance = data.amount;
    trs.publicKey = data.sender.publicKey;
    trs.trsName = 'MIGRATION';
    return trs;
};
/**
 * Returns fees.
 * @param {transaction} trs
 * @param {account} sender
 * @return {number} fee
 */
Migration.prototype.calculateFee = function (trs, sender) {
    return 0;
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} errors | trs
 */
Migration.prototype.verify = function (trs, sender, cb) {
    return setImmediate(cb, null, trs);
};

Migration.prototype.verifyUnconfirmed = function (trs, sender, cb) {
    return setImmediate(cb);
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb, null, trs
 */
Migration.prototype.process = function (trs, sender, cb) {
    return setImmediate(cb, null, trs);
};

/**
 * @param {transaction} trs
 * @return {null}
 */
Migration.prototype.getBytes = function (trs) {
    return Buffer.from([]);
};

/**
 * Calls db query to insert data into mem_Accounts table.
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} error, cb
 */
Migration.prototype.apply = function (trs, block, sender, cb) {
    self.scope.db.none(sql.insertMemberAccount, {
        address: trs.senderId,
        publicKey: trs.publicKey,
        balance: trs.stakedAmount,
        u_balance: trs.stakedAmount,
        totalFrozeAmount: trs.stakedAmount,
        group_bonus: trs.groupBonus
    }).then(() => {
        cb(null);
    }).catch((err) => {
        if (err) {
            console.log(`error : ${err}`);
        }
        cb(err);
    });
};

/**
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} error, cb
 */
Migration.prototype.undo = function (trs, block, sender, cb) {
    return setImmediate(cb);
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Migration.prototype.applyUnconfirmed = function (trs, sender, cb) {
    return setImmediate(cb);
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Migration.prototype.undoUnconfirmed = function (trs, sender, cb) {
    return setImmediate(cb);
};

Migration.prototype.calcUndoUnconfirmed = async (trs, sender) => {
    return sender;
};

/**
 * Deletes blockId from transaction
 * @param {transaction} trs
 * @return {transaction}
 */
Migration.prototype.objectNormalize = function (trs) {
    delete trs.blockId;
    return trs;
};

/**
 * @param {Object} raw
 * @return {null}
 */
Migration.prototype.dbRead = function (raw) {
    return null;
};

/**
 * @param {transaction} trs
 * @return {null}
 */
Migration.prototype.dbSave = function (trs) {
    return null;
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @return null
 */
Migration.prototype.ready = function (trs, sender) {
    return true;
};

// Export
module.exports = Migration;
