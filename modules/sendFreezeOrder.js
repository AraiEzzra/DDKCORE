'use strict';

var _ = require('lodash');
var async = require('async');
var constants = require('../helpers/constants.js');
var crypto = require('crypto');
var extend = require('extend');
var OrderBy = require('../helpers/orderBy.js');
var sandboxHelper = require('../helpers/sandbox.js');
//navin
var schema = require('../schema/frogeTransfer.js');
var sql = require('../sql/frogings.js');
var TransactionPool = require('../logic/transactionPool.js');
var transactionTypes = require('../helpers/transactionTypes.js');
var Transfer = require('../logic/transfer.js');
//navin
var sendFreezeOrder = require('../logic/sendFreezeOrder.js');
var bignum = require('../helpers/bignum.js');

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
function SendFreezeOrder(cb, scope) {
	library = {
		logger: scope.logger,
		db: scope.db,
		schema: scope.schema,
		ed: scope.ed,
		balancesSequence: scope.balancesSequence,
		logic: {
			transaction: scope.logic.transaction,
			sendFreezeOrder: scope.logic.sendFreezeOrder
		},
		genesisblock: scope.genesisblock
	};

	self = this;

	__private.assetTypes[transactionTypes.SENDFREEZE] = library.logic.transaction.attachAssetType(
		transactionTypes.SENDFREEZE,
		new sendFreezeOrder(
			scope.logger,
			scope.db
		)
	);

	setImmediate(cb, null, self);
}

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


	__private.assetTypes[transactionTypes.SENDFREEZE].bind(
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
		library.schema.validate(req.body, schema.transferFreezeOrder, function (err) {
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

			var query = { address: req.body.recipientId };

			library.balancesSequence.add(function (cb) {
				modules.accounts.getAccount(query, function (err, recipient) {
					if (err) {
						return setImmediate(cb, err);
					}

					var recipientId = recipient ? recipient.address : req.body.recipientId;

					if (!recipientId) {
						return setImmediate(cb, 'Invalid recipient');
					}

					if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
						modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, function (err, account) {
							//*************  NAVIN */
							library.logic.sendFreezeOrder.sendFreezedOrder({
								account: account,
								req: req
							}, function (err) {

								if (err) {
									return setImmediate(cb, err);
								}

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
											type: transactionType.SENDFREEZE,
											sender: account,
											frozeId: req.body.frozeId,
											keypair: keypair,
											recipientId: recipientId,
											secondKeypair: secondKeypair,
											requester: keypair
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
							//*************  NAVIN */
							library.logic.sendFreezeOrder.sendFreezedOrder({
								account: account,
								req: req
							}, function (err,freezedAmount) {
								if (err) {
									return setImmediate(cb, err);
								}

								var freezedAmount = freezedAmount ? parseInt(freezedAmount) :0;

								if (!account || !account.publicKey) {
									return setImmediate(cb, 'Account not found');
								}

								if (account.secondSignature && !req.body.secondSecret) {
									return setImmediate(cb, 'Missing second passphrase');
								}

								var secondKeypair = null;

								if (account.secondSignature) {
									var secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
									secondKeypair = library.ed.makeKeypair(secondHash);
								}

								var transaction;

								try {
									transaction = library.logic.transaction.create({
										type: transactionTypes.SENDFREEZE,
										sender: account,
										frozeId: req.body.frozeId,
										keypair: keypair,
										recipientId: recipientId,
										secondKeypair: secondKeypair,
										amount: freezedAmount
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

				return setImmediate(cb, null, { transactionId: transaction[0].id });
			});
		});


	}
};

// Export
module.exports = SendFreezeOrder;
