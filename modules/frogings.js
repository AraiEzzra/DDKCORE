'use strict';

var _ = require('lodash');
var async = require('async');
var constants = require('../helpers/constants.js');
var crypto = require('crypto');
var extend = require('extend');
var OrderBy = require('../helpers/orderBy.js');
var sandboxHelper = require('../helpers/sandbox.js');
var schema = require('../schema/frogings.js');
var sql = require('../sql/frogings.js');
var TransactionPool = require('../logic/transactionPool.js');
var transactionTypes = require('../helpers/transactionTypes.js');
var Transfer = require('../logic/transfer.js');
var Frozen = require('../logic/frozen.js');
var bignum = require('../helpers/bignum.js');
var sql = require('../sql/referal_sql');
var env = process.env;

// Private fields
var __private = {};
var shared = {};
var modules;
var library;
var self;

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
function Frogings (cb, scope) {
	library = {
		logger: scope.logger,
		db: scope.db,
		schema: scope.schema,
		ed: scope.ed,
		balancesSequence: scope.balancesSequence,
		logic: {
			transaction: scope.logic.transaction,
			frozen: scope.logic.frozen
		},
		genesisblock: scope.genesisblock,
		network: scope.network,
		config: scope.config
	};

	self = this;

	__private.transactionPool = new TransactionPool(
		scope.config.broadcasts.broadcastInterval,
		scope.config.broadcasts.releaseLimit,
		scope.logic.transaction,
		scope.bus,
		scope.logger
	);

	__private.assetTypes[transactionTypes.FROZE] = library.logic.transaction.attachAssetType(
		transactionTypes.FROZE, new Frozen(scope.logger, scope.db, scope.logic.transaction, scope.network, scope.config)
	);

	setImmediate(cb, null, self);
}


Frogings.prototype.referalReward = function (amount, address, cb) {
	var amount = amount;
	var sponsor_address = address;
	var overrideReward = {},
		i = 0;

	library.db.one(sql.referLevelChain, {
		address: sponsor_address
	}).then(function (user) {

		if (user.level != null && user.level[0] != "0") {

			overrideReward[user.level[i]] = (((env.STAKE_REWARD) * amount) / 100);

			var transactionData = {
				json: {
					secret: env.SENDER_SECRET,
					amount: overrideReward[user.level[i]],
					recipientId: user.level[i],
					transactionRefer: 11
				}
			};

			library.logic.transaction.sendTransaction(transactionData, function (err, transactionResponse) {
				if (err) return err;
				if (transactionResponse.body.success == false) {
					var info = transactionResponse.body.error;
					var sender_balance = parseFloat(transactionResponse.body.error.split('balance:')[1]);
					return setImmediate(cb, info, sender_balance);
				} else {
					return setImmediate(cb, null);
				}
			});

		} else {
			var error = "No Introducer Found";
			return setImmediate(cb, error);
		}

	}).catch(function (err) {
		return setImmediate(cb, err);
	});
}


// Events
/**
 * Bounds scope to private transactionPool and modules
 * to private Transfer instance.
 * @implements module:transactions#Transfer~bind
 * @param {scope} scope - Loaded modules.
 */
Frogings.prototype.onBind = function (scope) {
	modules = {
		accounts: scope.accounts,
		transactions: scope.transactions
	};

	__private.transactionPool.bind(
		scope.accounts,
		scope.transactions,
		scope.loader
	);
	__private.assetTypes[transactionTypes.FROZE].bind(
		scope.accounts,
		scope.rounds,
		scope.blocks
	);

};


// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Frogings.prototype.shared = {

	countStakeholders: function (req, cb) {

		library.db.one(sql.countStakeholders)
		.then(function (row) {
			return setImmediate(cb, null, {
				countStakeholders: row
			});
		})
		.catch(function (err) {
			return setImmediate(cb, 'Error while counting Stakeholders');
		});

	},

	totalETPStaked: function (req, cb) {
		library.db.one(sql.getTotalStakedAmount)
		.then(function (row) {
			return setImmediate(cb, null, {
				totalETPStaked: row
			});
		})
		.catch(function (err) {
			return setImmediate(cb, 'Error in getting sum of ETP staked');
		});
	},

	getMyETPFrozen: function (req, cb) {
		library.schema.validate(req.body, schema.getMyETPFrozen, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}
			var hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			var keypair = library.ed.makeKeypair(hash);

			modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
				if (!account || !account.address) {
					return setImmediate(cb, 'Address of account not found');
				}

				library.db.one(sql.getMyStakedAmount, { address: account.address })
				.then(function (row) {
					return setImmediate(cb, null, {
						totalETPStaked: row
					});
				})
				.catch(function (err) {
					return setImmediate(cb, 'Error in getting my sum of ETP staked');
				});
			});
		});
	},
	
	getAllFreezeOrders: function (req, cb) {

		library.schema.validate(req.body, schema.getAllFreezeOrder, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}
			var hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			var keypair = library.ed.makeKeypair(hash);

			modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
				if (!account || !account.address) {
					return setImmediate(cb, 'Address of account not found');
				}

				library.db.query(sql.getFrozeOrders, { senderId: account.address })
				.then(function (rows) {
					return setImmediate(cb, null, {
						freezeOrders: JSON.stringify(rows)
					});
				})
				.catch(function (err) {
					return setImmediate(cb, 'Unable to get froze orders');
				});
			});
		});
	},

	getAllActiveFreezeOrders: function (req, cb) {


		library.schema.validate(req.body, schema.getAllActiveFreezeOrder, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}
			var hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			var keypair = library.ed.makeKeypair(hash);

			modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
				if (!account || !account.address) {
					return setImmediate(cb, 'Address of account not found');
				}
				
				library.db.one(sql.getActiveFrozeOrders, { senderId: account.address })
				.then(function (rows) {
					return setImmediate(cb, null, {
						freezeOrders: JSON.stringify(rows)
					});
				})
				.catch(function (err) {
					return setImmediate(cb, 'Unable to get active froze orders');
				});

			});
		});
	},

	addTransactionForFreeze: function (req, cb) {

		let accountData;
		library.schema.validate(req.body, schema.addTransactionForFreeze, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			var hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			var keypair = library.ed.makeKeypair(hash);

			if (req.body.publicKey) {
				if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
					return setImmediate(cb, 'Invalid passphrase');
				}
			}

			library.balancesSequence.add(function (cb) {
				if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
					modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, function (err, account) {
						if (err) {
							return setImmediate(cb, err);
						}
						accountData = account;

						if (!account || !account.publicKey) {
							return setImmediate(cb, 'Multisignature account not found');
						}

						if (!account.multisignatures || !account.multisignatures) {
							return setImmediate(cb, 'Account does not have multisignatures enabled');
						}

						if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
							return setImmediate(cb, 'Account does not belong to multisignature group');
						}

						modules.accounts.getAccount({ publicKey: keypair.publicKey }, function (err, requester) {
							if (err) {
								return setImmediate(cb, err);
							}

							if (!requester || !requester.publicKey) {
								return setImmediate(cb, 'Requester not found');
							}

							if (requester.secondSignature && !req.body.secondSecret) {
								return setImmediate(cb, 'Missing requester second passphrase');
							}

							if (requester.publicKey === account.publicKey) {
								return setImmediate(cb, 'Invalid requester public key');
							}

							var secondKeypair = null;

							if (requester.secondSignature) {
								var secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
								secondKeypair = library.ed.makeKeypair(secondHash);
							}

							var transaction;

							try {
								transaction = library.logic.transaction.create({
									type: transactionTypes.FROZE,
									freezedAmount: req.body.freezedAmount,
									sender: account,
									keypair: keypair,
									secondKeypair: secondKeypair,
									requester: keypair
								});
							} catch (e) {
								return setImmediate(cb, e.toString());
							}
							modules.transactions.receiveTransactions([transaction], true, cb);
						});

					});
				} else {
					modules.accounts.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
						if (err) {
							return setImmediate(cb, err);
						}
						accountData = account;
						if (!account || !account.publicKey) {
							return setImmediate(cb, 'Account not found');
						}

						if (account.secondSignature && !req.body.secondSecret) {
							return setImmediate(cb, 'Invalid second passphrase');
						}

						var secondKeypair = null;

						if (account.secondSignature) {
							var secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
							secondKeypair = library.ed.makeKeypair(secondHash);
						}

						var transaction;

						try {
							transaction = library.logic.transaction.create({
								type: transactionTypes.FROZE,
								freezedAmount: req.body.freezedAmount,
								sender: account,
								keypair: keypair,
								secondKeypair: secondKeypair
							});
						} catch (e) {
							return setImmediate(cb, e.toString());
						}

						modules.transactions.receiveTransactions([transaction], true, cb);
					});
				}
			}, function (err, transaction) {
				if (err) {
					return setImmediate(cb, err);
				}

				library.logic.frozen.updateFrozeAmount({
					account: accountData,
					freezedAmount: req.body.freezedAmount
				}, function (err) {
					if (err) {
						return setImmediate(cb, err);
					}
					library.network.io.sockets.emit('updateTotalStakeAmount', null);

					self.referalReward(req.body.freezedAmount,accountData.address,function(err,bal){
						if(err){
							if(bal < 0.0001)
								library.logger.info(err);
						}
						return setImmediate(cb, null, { transaction: transaction[0]});
					});

				});
			});
		});


	}
};

// Export
module.exports = Frogings;
