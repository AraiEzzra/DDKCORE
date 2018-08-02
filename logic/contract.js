let modules, self;

/**
 * Main Contract logic.
 * @memberof module:contracts
 * @class
 * @classdesc Main Contract logic.
 * @param {Object} config
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} With `this` as data.
 */
function Contract(config, db, cb) {
	self = this;
	self.scope = {
		config: config,
		db: db
	};

	if (cb) {
		return setImmediate(cb, null, this);
	}
}

/**
 * @desc create
 * @private
 * @param {Object} data - data
 * @param {Object} trs - transation data
 * @return {trs} trs
 */
Contract.prototype.create = function (data, trs) {
	trs.trsName = 'CONTRACT';
	return trs;
};

/**
 * @desc calculate fee for transaction type 9
 * @private
 * @return 0
 */
Contract.prototype.calculateFee = function () {
	return 0;
};

/**
 * @desc verify
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.verify = function (trs, sender, cb) {
	setImmediate(cb, null, trs);
};

/**
 * @desc get bytes
 * @private
 * @implements 
 * @return {null}
 */
Contract.prototype.getBytes = function () {
	return null;
};

/**
 * @desc appliy
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.apply = function (trs, sender, cb) {
	setImmediate(cb);
};

/**
 * @desc undo transaction
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.undo = function (trs, sender, cb) {
	setImmediate(cb);
};

/**
 * @desc apply unconfirmed transactions
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.applyUnconfirmed = function (trs, sender, cb) {
	setImmediate(cb);
};

/**
 * @desc undo unconfirmed transations
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.undoUnconfirmed = function (trs, sender, cb) {
	setImmediate(cb);
};

/**
 * @desc on modules ready
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.ready = function (trs, sender, cb) {
	setImmediate(cb);
};

/**
 * @desc save data to satabase
 * @private
 * @implements 
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {fucntion} cb
 */
Contract.prototype.save = function (trs, cb) {
	setImmediate(cb);
};

/**
 * @desc database read
 * @private
 * @implements
 * @return {null}
 */
Contract.prototype.dbRead = function () {
	return null;
};

/**
 * @desc normalize object
 * @private
 * @implements 
 * @param {Object} asset - transaction data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.objectNormalize = function (asset, cb) {
	setImmediate(cb);
};

/**
 * @desc process transaction
 * @private
 * @implements 
 * @param {Object} sender - sender data
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

/**
 * @desc calculate end time for user to be unlocked by transaction type 9
 * @private
 * @implements calculate lock period based on {accType}
 * @param {Integer} accType - type of account as described in ../helpers/userGroups.js
 * @param {timestamp} startTime - start time when a user locked throug admin panel
 * @param {timestamp} endTime - lock time based on {accType}
 * @return {timestamp} endTime
 */
Contract.prototype.calcEndTime = function (accType, startTime) {
	let date = new Date(startTime * 1000);
	if (accType === 1 || accType === 0) {
		let endTime = (date.setMinutes(date.getMinutes() + 90 * 24 * 60 * 60)) / 1000;
		return endTime;
	} else if (accType === 2) {
		let endTime = (date.setMinutes(date.getMinutes() + 90 * 24 * 60 * 60)) / 1000;
		return endTime;
	} else if (accType === 3) {
		let endTime = (date.setMinutes(date.getMinutes() + 365 * 24 * 60 * 60)) / 1000;
		return endTime;
	}
};

/**
 * @desc send transaction through contract
 * @private
 * @implements send contract amount to respective users
 * @param {Object} data - user details who will get contarct amount
 * @param {Object} trs - transation data
 * @param {function} cb - Callback function.
 * @return {function} cb
 */
Contract.prototype.sendContractAmount = function (data, cb) {
	let query = [];
	data.forEach(function (recipient) {
		let sender = self.scope.config.users[recipient.accType];
		query.push(modules.accounts.mergeAccountAndGet({
			publicKey: sender.publicKey,
			balance: -recipient.transferedAmount,
			u_balance: -recipient.transferedAmount
		}));
		query.push(modules.accounts.mergeAccountAndGet({
			publicKey: recipient.publicKey,
			balance: recipient.transferedAmount,
			u_balance: recipient.transferedAmount
		}));
		function Tick(t) {
			return t.none(query.join(''));
		}
		self.scope.db.tx(Tick)
		.then(function () {
			setImmediate(cb, null);
		})
		.catch(function (err) {
			setImmediate(cb, err);
		});  
	});
};

/**
 * @desc on bine
 * @private
 * @implements 
 * @param {Object} accounts - modules:accounts
 */
Contract.prototype.bind = function (accounts) {
	modules = {
		accounts: accounts,
	};
};

module.exports = Contract;

/*************************************** END OF FILE *************************************/
