

let crypto = require('crypto');
let sandboxHelper = require('../helpers/sandbox.js');
let schema = require('../schema/frogeTransfer.js');
let sql = require('../sql/frogings.js');
let TransactionPool = require('../logic/transactionPool.js');
let transactionTypes = require('../helpers/transactionTypes.js');
let sendFreezeOrder = require('../logic/sendFreezeOrder.js');

// Private fields
let __private = {};
let shared = {};
let modules;
let library;
let self;

__private.assetTypes = {};

/**
 * Initializes library with scope content and generates a Transfer instance
 * and a TransactionPool instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:transactions
 * @class
 * @classdesc Main transactions methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function SendFreezeOrder (cb, scope) {
	library = {
		logger: scope.logger,
		db: scope.db,
		schema: scope.schema,
		ed: scope.ed,
		balancesSequence: scope.balancesSequence,
		logic: {
			transaction: scope.logic.transaction,
			frozen: scope.logic.frozen,
			sendFreezeOrder : scope.logic.sendFreezeOrder
		},
		genesisblock: scope.genesisblock
	};

	self = this;

	__private.transactionPool = new TransactionPool(
		scope.config.broadcasts.broadcastInterval,
		scope.config.broadcasts.releaseLimit,
		scope.logic.transaction,
		scope.bus,
		scope.logger
	);


	__private.assetTypes[transactionTypes.SENDSTAKE] = library.logic.transaction.attachAssetType(
		transactionTypes.SENDSTAKE, 
		new sendFreezeOrder(
			scope.logger,
			scope.db,
			scope.network
		)
	);

	setImmediate(cb, null, self);
}


/**
 * Gets transaction by id from `trs_list` view.
 * @private
 * @param {string} id
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | data: {transaction}
 */
__private.getById = function (id, cb) {
	library.db.query(sql.getById, {id: id})
	.then(function (rows) {
		if (!rows.length) {
			return setImmediate(cb, 'Transaction not found: ' + id);
		}

		let transacton = library.logic.transaction.dbRead(rows[0]);

		return setImmediate(cb, null, transacton);
	})
	.catch(function (err) {
		library.logger.error(err.stack);
		return setImmediate(cb, 'Transactions#getById error');
	});
};

/**
 * Applies confirmed transaction.
 * @implements {logic.transaction.apply}
 * @param {transaction} transaction
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 */
SendFreezeOrder.prototype.apply = function (transaction, block, sender, cb) {
	library.logger.debug('Applying confirmed transaction', transaction.id);
	library.logic.transaction.apply(transaction, block, sender, cb);
};

/**
 * Undoes confirmed transaction.
 * @implements {logic.transaction.undo}
 * @param {transaction} transaction
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 */
SendFreezeOrder.prototype.undo = function (transaction, block, sender, cb) {
	library.logger.debug('Undoing confirmed transaction', transaction.id);
	library.logic.transaction.undo(transaction, block, sender, cb);
};

/**
 * Gets requester if requesterPublicKey and calls applyUnconfirmed.
 * @implements {modules.accounts.getAccount}
 * @implements {logic.transaction.applyUnconfirmed}
 * @param {transaction} transaction
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} for errors
 */
SendFreezeOrder.prototype.applyUnconfirmed = function (transaction, sender, cb) {
	library.logger.debug('Applying unconfirmed transaction', transaction.id);

	if (!sender && transaction.blockId !== library.genesisblock.block.id) {
		return setImmediate(cb, 'Invalid block id');
	} else {
		if (transaction.requesterPublicKey) {
			modules.accounts.getAccount({publicKey: transaction.requesterPublicKey}, function (err, requester) {
				if (err) {
					return setImmediate(cb, err);
				}

				if (!requester) {
					return setImmediate(cb, 'Requester not found');
				}

				library.logic.transaction.applyUnconfirmed(transaction, sender, requester, cb);
			});
		} else {
			library.logic.transaction.applyUnconfirmed(transaction, sender, cb);
		}
	}
};

/**
 * Validates account and Undoes unconfirmed transaction.
 * @implements {modules.accounts.getAccount}
 * @implements {logic.transaction.undoUnconfirmed}
 * @param {transaction} transaction
 * @param {function} cb
 * @return {setImmediateCallback} For error
 */
SendFreezeOrder.prototype.undoUnconfirmed = function (transaction, cb) {
	library.logger.debug('Undoing unconfirmed transaction', transaction.id);

	modules.accounts.getAccount({publicKey: transaction.senderPublicKey}, function (err, sender) {
		if (err) {
			return setImmediate(cb, err);
		}
		library.logic.transaction.undoUnconfirmed(transaction, sender, cb);
	});
};

/**
 * Receives transactions
 * @param {transaction[]} transactions
 * @param {Object} broadcast
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.receiveTransactions
 */
SendFreezeOrder.prototype.receiveTransactions = function (transactions, broadcast, cb) {
	return __private.transactionPool.receiveTransactions(transactions, broadcast, cb);
};

/**
 * Fills pool.
 * @param {function} cb - Callback function.
 * @return {function} Calls transactionPool.fillPool
 */
SendFreezeOrder.prototype.fillPool = function (cb) {
	return __private.transactionPool.fillPool(cb);
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {*} args - List of arguments.
 * @param {function} cb - Callback function.
 */
SendFreezeOrder.prototype.sandboxApi = function (call, args, cb) {
	sandboxHelper.callMethod(shared, call, args, cb);
};

/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
SendFreezeOrder.prototype.isLoaded = function () {
	return !!modules;
};

// Events
/**
 * Bounds scope to private transactionPool and modules
 * to private Transfer instance.
 * @implements module:transactions#Transfer~bind
 * @param {scope} scope - Loaded modules.
 */
SendFreezeOrder.prototype.onBind = function (scope) {
	modules = {
		accounts: scope.accounts,
		transactions: scope.transactions,
	};

	__private.transactionPool.bind(
		scope.accounts,
		scope.transactions,
		scope.loader
	);
	__private.assetTypes[transactionTypes.SENDSTAKE].bind(
		scope.accounts,
		scope.rounds
	);
};


// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
SendFreezeOrder.prototype.shared = {

	transferFreezeOrder: function (req, cb) {
		let accountData, stakeOrder;
		library.schema.validate(req.body, schema.transferFreezeOrder, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			let keypair = library.ed.makeKeypair(hash);

			if (req.body.publicKey) {
				if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
					return setImmediate(cb, 'Invalid passphrase');
				}
			}

			let query = { address: req.body.recipientId };

			library.balancesSequence.add(function (cb) {
				modules.accounts.getAccount(query, function (err, recipient) {
					if (err) {
						return setImmediate(cb, err);
					}

					let recipientId = recipient ? recipient.address : req.body.recipientId;

					if (!recipientId) {
						return setImmediate(cb, 'Invalid recipient');
					}

					if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
						modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, function (err, account) {
							if (err) {
								return setImmediate(cb, err);
							}

							accountData = account;

							if (!account || !account.publicKey) {
								return setImmediate(cb, 'Multisignature account not found');
							}

							if (!Array.isArray(account.multisignatures)) {
								return setImmediate(cb, 'Account does not have multisignatures enabled');
							}

							if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
								return setImmediate(cb, 'Account does not belong to multisignature group');
							}

							modules.accounts.getAccount({ publicKey: keypair.publicKey }, function (err, requester) {
								if (err) {
									return setImmediate(cb, err);
								}

								library.logic.sendFreezeOrder.getActiveFrozeOrder({
									address: account.address,
									stakeId: req.body.stakeId
								}, function (err, order) {
									if (err) {
										return setImmediate(cb, err);
									}

									if (order !== null && order.isTransferred == 3) {
										return setImmediate(cb, 'Order can be send only 3 times');
									}
									stakeOrder = order;

									if (!requester || !requester.publicKey) {
										return setImmediate(cb, 'Requester not found');
									}

									if (requester.secondSignature && !req.body.secondSecret) {
										return setImmediate(cb, 'Missing second passphrase');
									}

									if (requester.publicKey === account.publicKey) {
										return setImmediate(cb, 'Invalid requester public key');
									}

									let secondKeypair = null;

									if (requester.secondSignature) {
										let secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
										secondKeypair = library.ed.makeKeypair(secondHash);
									}

									let transaction;

									try {
										transaction = library.logic.transaction.create({
											type: transactionTypes.SENDSTAKE,
											sender: account,
											stakeId: req.body.stakeId,
											keypair: keypair,
											recipientId: recipientId,
											secondKeypair: secondKeypair,
											requester: keypair,
											freezedAmount: req.body.freezedAmount
										});
									} catch (e) {
										return setImmediate(cb, e.toString());
									}

									modules.transactions.receiveTransactions([transaction], true, cb);
								});
							});
						});

					} else {
						modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
							if (err) {
								return setImmediate(cb, err);
							}

							library.logic.sendFreezeOrder.getActiveFrozeOrder({
								address: account.address,
								stakeId: req.body.stakeId
							}, function (err, order) {
								if (err) {
									return setImmediate(cb, err);
								}

								if(order !== null && order.isTransferred == 3){
									return setImmediate(cb, 'Order can be send only 3 times');
								}
								stakeOrder = order;

								accountData = account;
								if (!account || !account.publicKey) {
									return setImmediate(cb, 'Account not found');
								}

								if (account.secondSignature && !req.body.secondSecret) {
									return setImmediate(cb, 'Missing second passphrase');
								}

								let secondKeypair = null;

								if (account.secondSignature) {
									let secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
									secondKeypair = library.ed.makeKeypair(secondHash);
								}

								let transaction;

								try {
									transaction = library.logic.transaction.create({
										type: transactionTypes.SENDSTAKE,
										sender: account,
										stakeId: req.body.stakeId,
										keypair: keypair,
										recipientId: recipientId,
										secondKeypair: secondKeypair,
										freezedAmount: req.body.freezedAmount
									});
								} catch (e) {
									return setImmediate(cb, e.toString());
								}

								modules.transactions.receiveTransactions([transaction], true, cb);

							});
						});
					}

				});
			}, function (err, transaction) {
				if (err) {
					return setImmediate(cb, err);
				}

				library.logic.sendFreezeOrder.sendFreezedOrder({
					account: accountData,
					recipientId: req.body.recipientId,
					stakeId: req.body.stakeId,
					stakeOrder: stakeOrder
				}, function (err) {

					if (err) {
						return setImmediate(cb, err);
					}
					return setImmediate(cb, null, { transactionId: transaction[0].id });

				});
			});
		});
	}
};

// Export
module.exports = SendFreezeOrder;

/*************************************** END OF FILE *************************************/
