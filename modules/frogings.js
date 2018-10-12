

let crypto = require('crypto');
let schema = require('../schema/frogings.js');
let sql = require('../sql/frogings.js');
let TransactionPool = require('../logic/transactionPool.js');
let transactionTypes = require('../helpers/transactionTypes.js');
let Frozen = require('../logic/frozen.js');
let ref_sql = require('../sql/referal_sql');
let env = process.env;
let constants = require('../helpers/constants.js');
let cache = require('./cache.js');
let slots = require('../helpers/slots');
let reward = require('../helpers/rewards');

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
function Frogings(cb, scope) {
	library = {
		logger: scope.logger,
		db: scope.db,
		dbReplica: scope.dbReplica,
		cache: scope.cache,
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

	__private.assetTypes[transactionTypes.STAKE] = library.logic.transaction.attachAssetType(
		transactionTypes.STAKE, new Frozen(scope.logger, scope.db, scope.dbReplica, scope.logic.transaction, scope.network, scope.config, scope.balancesSequence, scope.ed)
	);

	setImmediate(cb, null, self);
}

/**
 * Direct introducer reward.
 * 10 percent of Reward send to the Direct introducer for staking the amount by it's sponsor.
 * Reward is send through the main account.
 * Disable refer option when main account balance becomes zero.
 * @param {stake_amount} - Amount stake by the user.
 * @param {address} - Address of user which staked the amount.
 * @param {cb} - callback function.
 * @author - Satish Joshi 
 */

Frogings.prototype.referralReward = function (stake_amount, address, cb) {

	let sponsor_address = address;
	let introducerReward = {},
		i = 0;

	library.dbReplica.query(ref_sql.referLevelChain, {
		address: sponsor_address
	}).then(function (user) {

		if (user.length != 0 && user[0].level != null) {

			let sponsorId = user[0].level;

			introducerReward[sponsorId[i]] = (((reward.stakeReward) * stake_amount) / 100);

			let hash = Buffer.from(JSON.parse(library.config.users[6].keys));
			let keypair = library.ed.makeKeypair(hash);
			let publicKey = keypair.publicKey.toString('hex');
			library.balancesSequence.add(function (reward_cb) {
				modules.accounts.getAccount({ publicKey: publicKey }, function (err, account) {
					if (err) {
						return setImmediate(cb, err);
					}
					let transaction;
					let secondKeypair = null;
					account.publicKey = publicKey;

					try {
						transaction = library.logic.transaction.create({
							type: transactionTypes.REFER,
							amount: introducerReward[sponsorId[i]],
							sender: account,
							recipientId: sponsorId[i],
							keypair: keypair,
							secondKeypair: secondKeypair,
							trsName: "DIRECTREF",
							rewardPercentage: reward.stakeReward.toString()
						});
					} catch (e) {
						return setImmediate(cb, e.toString());
					}
					modules.transactions.receiveTransactions([transaction], true, reward_cb);
				});
			}, function (err, transaction) {
				if (err) {
					return setImmediate(cb, err);
				}
				else {
					// (async function(){
					library.db.none(ref_sql.updateRewardTypeTransaction, {
						trsId: transaction[0].id,
						sponsorAddress: sponsor_address,
						introducer_address: sponsorId[i],
						reward: introducerReward[sponsorId[i]],
						level: "Level 1",
						transaction_type: "DIRECTREF",
						time: slots.getTime()
					}).then(function () {
						return setImmediate(cb, null);
					}).catch(function (err) {
						return setImmediate(cb, err);
					});
					// }());
				}
			});
		} else {
			library.logger.info("Direct Introducer Reward Info : No referrals or any introducer found");
			return setImmediate(cb, null);
		}

	}).catch(function (err) {
		return setImmediate(cb, err);
	});
};


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
	__private.assetTypes[transactionTypes.STAKE].bind(
		scope.accounts,
		scope.rounds,
		scope.blocks,
		scope.transactions
	);

};


// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Frogings.prototype.shared = {

	getMyDDKFrozen: function (req, cb) {
		library.schema.validate(req.body, schema.getMyDDKFrozen, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}
			let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			let keypair = library.ed.makeKeypair(hash);

			modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
				if (!account || !account.address) {
					return setImmediate(cb, 'Address of account not found');
				}

				library.db.one(sql.getMyStakedAmount, { address: account.address })
					.then(function (row) {
						return setImmediate(cb, null, {
							totalDDKStaked: row
						});
					})
					.catch(function (err) {
						return setImmediate(cb, err);
					});
			});
		});
	},

	getAllFreezeOrders: function (req, cb) {

		library.schema.validate(req.body, schema.getAllFreezeOrder, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}
			let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			let keypair = library.ed.makeKeypair(hash);

			modules.accounts.getAccount({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
				if (!account || !account.address) {
					return setImmediate(cb, 'Address of account not found');
				}

				library.dbReplica.query(sql.getFrozeOrders, { senderId: account.address })
					.then(function (rows) {
						return setImmediate(cb, null, {
							freezeOrders: JSON.stringify(rows)
						});
					})
					.catch(function (err) {
						return setImmediate(cb, err);
					});
			});
		});
	},

	getAllActiveFreezeOrders: function (req, cb) {


		library.schema.validate(req.body, schema.getAllActiveFreezeOrder, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}
			let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			let keypair = library.ed.makeKeypair(hash);

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
						return setImmediate(cb, err);
					});

			});
		});
	},

	addTransactionForFreeze: function (req, cb) {
		return setImmediate(cb, 'Stake Transaction Disabled'); 
		let accountData;
		library.schema.validate(req.body, schema.addTransactionForFreeze, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
			let keypair = library.ed.makeKeypair(hash);
			let publicKey = keypair.publicKey.toString('hex');

			if (req.body.publicKey) {
				if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
					return setImmediate(cb, 'Invalid passphrase');
				}
			}
			modules.transactions.getUserUnconfirmedTransactions('getUnconfirmedTransactionList', {
				body: {
					senderPublicKey: publicKey
				}
			}, function (err, unconfirmedTrsList) {
				if (err) {
					return setImmediate(cb, err);
				}
				if (unconfirmedTrsList.transactions.length > 1) {
					return setImmediate(cb, 'Your transaction is in pending state. Wait untill it is confirmed and try again!');
				} else {
					let senderAddress = modules.accounts.generateAddressByPublicKey(publicKey);
					modules.transactions.getLastTransactionConfirmations(senderAddress, function (err, data) {
						if (err) {
							return setImmediate(cb, err);
						}
						if (data.length === 1 && data[0].b_confirmations < 10) {
							return setImmediate(cb, 'Your last transactions is getting verified. Please wait untill block confirmations becomes 10 and try again. Current confirmations : ' + data[0].b_confirmations);
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

										if ((req.body.freezedAmount + (constants.fees.froze * req.body.freezedAmount) / 100 + parseInt(account.totalFrozeAmount)) > account.balance) {
											return setImmediate(cb, 'Insufficient balance');
										}

										let transaction;

										try {
											transaction = library.logic.transaction.create({
												type: transactionTypes.STAKE,
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
										return setImmediate(cb, 'Missing second passphrase');
									}

									let secondKeypair = null;

									if (account.secondSignature) {
										let secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
										secondKeypair = library.ed.makeKeypair(secondHash);
									}

									if ((req.body.freezedAmount + (constants.fees.froze * req.body.freezedAmount) / 100 + parseInt(account.totalFrozeAmount)) > account.balance) {
										return setImmediate(cb, 'Insufficient balance');
									}

									let transaction;

									try {
										transaction = library.logic.transaction.create({
											type: transactionTypes.STAKE,
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
							library.network.io.sockets.emit('stake/create', null);

							library.db.one(ref_sql.checkBalance, {
								sender_address: constants.airdropAccount
							}).then(function (bal) {
								let balance = parseFloat(bal.balance);
								if (balance > 1000) {
									self.referralReward(req.body.freezedAmount, accountData.address, function (err) {
										if (err) {
											library.logger.error(err);
										}
										return setImmediate(cb, null, {
											transaction: transaction[0],
											referStatus: true
										});
									});
								} else {
									cache.prototype.isExists("referStatus", function (err, exist) {
										if (!exist) {
											cache.prototype.setJsonForKey("referStatus", false);
										}
										return setImmediate(cb, null, {
											transaction: transaction[0],
											referStatus: false
										});
									});
								}
							}).catch(function (err) {
								library.logger.error('Error Message : ' + err.message + ' , Error query : ' + err.query + ' , Error stack : ' + err.stack);
								return setImmediate(cb, err);
							});
						});
					});
				}
			});
		});
	}
};

// Export
module.exports = Frogings;

/*************************************** END OF FILE *************************************/
