'use strict';

let constants = require('../helpers/constants.js');
let sql = require('../sql/referal_sql');

// Private fields
let modules, library, self;

/**
 * Main transfer logic.
 * @memberof module:transactions
 * @class
 * @classdesc Main transfer logic.
 */
// Constructor
function Migration(logger, db, cb) {
    self = this;
    self.scope = {
        logger: logger,
        db: db
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
		accounts: accounts,
		rounds: rounds,
	};
};

/**
 * Assigns data to transaction recipientId and amount.
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
	trs.trsName = "Migration";
	return trs;
};
/**
 * Returns send fees from constants.
 * @param {transaction} trs
 * @param {account} sender
 * @return {number} fee
 */
Migration.prototype.calculateFee = function (trs, sender) {

    return 0;
};

/**
 * Verifies recipientId and amount greather than 0.
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} errors | trs
 */
Migration.prototype.verify = function (trs, sender, cb) {
	/* if (!trs.recipientId) {
		return setImmediate(cb, 'Missing recipient');
	}

	if (trs.amount <= 0) {
		return setImmediate(cb, 'Invalid transaction amount');
	} */

	return setImmediate(cb, null, trs);
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
	return null;
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
Migration.prototype.apply = function (trs, block, sender, cb) {
/* 	modules.accounts.setAccountAndGet({address: trs.recipientId}, function (err, recipient) {
		if (err) {
			return setImmediate(cb, err);
		}

		modules.accounts.mergeAccountAndGet({
			address: trs.address,
			balance: trs.balance,
			u_balance: trs.balance,
			blockId: block.id,
			round: modules.rounds.calc(block.height)
		}, function (err) {
			return setImmediate(cb, err);
		});
	}); */

	self.scope.db.none(sql.insertMemberAccount, {
        address: trs.senderId,
        publicKey: trs.publicKey,
        balance: trs.stakedAmount,
        u_balance: trs.stakedAmount,
        totalFrozeAmount: trs.stakedAmount,
        group_bonus: trs.groupBonus
    }).then(function () {
        cb(null);
    }).catch(function (err) {
		if(err){
			console.log("err : "+err)
		}
        cb(err);
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
Migration.prototype.undo = function (trs, block, sender, cb) {
	modules.accounts.setAccountAndGet({address: trs.recipientId}, function (err, recipient) {
		if (err) {
			return setImmediate(cb, err);
		}
		modules.accounts.mergeAccountAndGet({
			address: trs.recipientId,
			balance: -trs.amount,
			u_balance: -trs.amount,
			blockId: block.id,
			round: modules.rounds.calc(block.height)
		}, function (err) {
			return setImmediate(cb, err);
		});
	});
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
	/* return {
		table: this.dbTable,
		fields: this.dbFields,
		values: {
			gbAmount: trs.groupBonus,
			transactionId: trs.id
		}
	}; */
	return null;
};

/**
 * Checks sender multisignatures and transaction signatures.
 * @param {transaction} trs
 * @param {account} sender
 * @return {boolean} True if transaction signatures greather than 
 * sender multimin or there are not sender multisignatures.
 */
Migration.prototype.ready = function (trs, sender) {
	if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
		if (!Array.isArray(trs.signatures)) {
			return false;
		}
		return trs.signatures.length >= sender.multimin;
	} else {
		return true;
	}
};

// Export
module.exports = Migration;
