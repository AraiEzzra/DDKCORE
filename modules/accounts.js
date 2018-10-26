

let bignum = require('../helpers/bignum.js');
let BlockReward = require('../logic/blockReward.js');
let constants = require('../helpers/constants.js');
let crypto = require('crypto');
let schema = require('../schema/accounts.js');
let sandboxHelper = require('../helpers/sandbox.js');
let transactionTypes = require('../helpers/transactionTypes.js');
let Vote = require('../logic/vote.js');
let sql = require('../sql/accounts.js');
let cache = require('./cache.js');
let config = process.env.NODE_ENV === 'development' ? require('../config/default') : process.env.NODE_ENV === 'testnet' ? require('../config/testnet') : require('../config/mainnet');
let jwt = require('jsonwebtoken');
let QRCode = require('qrcode');
let speakeasy = require('speakeasy');
let slots = require('../helpers/slots.js');
let async = require('async');
let nextBonus = 0;
let Mnemonic = require('bitcore-mnemonic');
let mailServices = require('../helpers/postmark');

// Private fields
let modules, library, self, __private = {}, shared = {};

__private.assetTypes = {};
__private.blockReward = new BlockReward();

/**
 * Initializes library with scope content and generates a Vote instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:accounts
 * @class
 * @classdesc Main accounts methods.
 * @implements module:accounts.Account#Vote
 * @param {scope} scope - App instance.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
function Accounts(cb, scope) {
	library = {
		ed: scope.ed,
		db: scope.db,
		cache: scope.cache,
		logger: scope.logger,
		schema: scope.schema,
		balancesSequence: scope.balancesSequence,
		logic: {
			account: scope.logic.account,
			transaction: scope.logic.transaction,
			contract: scope.logic.contract,
			vote: scope.logic.vote,
			frozen: scope.logic.frozen
		},
		config: scope.config
	};
	self = this;

	__private.assetTypes[transactionTypes.VOTE] = library.logic.transaction.attachAssetType(
		transactionTypes.VOTE,
		new Vote(
			scope.logger,
			scope.schema,
            scope.db,
			scope.logic.frozen
		)
	);

	setImmediate(cb, null, self);
}

/**
 * Gets account from publicKey obtained from secret parameter.
 * If not existes, generates new account data with public address
 * obtained from secret parameter.
 * @private
 * @param {function} secret
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} As per logic new|current account data object.
 */
__private.openAccount = function (secret, cb) {
	let hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
	let keypair = library.ed.makeKeypair(hash);
	let publicKey = keypair.publicKey.toString('hex');

	self.getAccount({ publicKey: publicKey }, function (err, account) {
		if (err) {
			return setImmediate(cb, err);
		}

		if (account) {
			if (account.publicKey == null) {
				account.publicKey = publicKey;
			}
			return setImmediate(cb, null, account);
		} else {
			let account = {
				address: self.generateAddressByPublicKey(publicKey),
				u_balance: '0',
				balance: '0',
				publicKey: publicKey,
				u_secondSignature: 0,
				secondSignature: 0,
				secondPublicKey: null,
				multisignatures: null,
				u_multisignatures: null
			};
			return setImmediate(cb, null, account);
		}
	});
};

/**
 * Generates address based on public key.
 * @param {publicKey} publicKey - PublicKey.
 * @returns {address} Address generated.
 * @throws {string} If address is invalid throws `Invalid public key`.
 */
Accounts.prototype.generateAddressByPublicKey = function (publicKey) {
	let publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
	let temp = Buffer.alloc(8);

	for (let i = 0; i < 8; i++) {
		temp[i] = publicKeyHash[7 - i];
	}

	let address = 'DDK' + bignum.fromBuffer(temp).toString();

	if (!address) {
		throw 'Invalid public key: ' + publicKey;
	}

	return address;
};

/**
 * Gets account information, calls logic.account.get().
 * @implements module:accounts#Account~get
 * @param {Object} filter - Containts publicKey.
 * @param {function} fields - Fields to get.
 * @param {function} cb - Callback function.
 */
Accounts.prototype.getAccount = function (filter, fields, cb) {
	if (filter.publicKey) {
		filter.address = self.generateAddressByPublicKey(filter.publicKey);
		delete filter.publicKey;
	}

	library.logic.account.get(filter, fields, cb);
};

/**  
 * Firstly check whether this referral id is valid or not.
 * If valid Generate referral chain for that user.
 * In case of no referral, chain will contain the null value i.e; Blank. 
 * @param {referalLink} - Refer Id.
 * @param {address} - Address of user during registration.
 * @param {cb} - callback function which return success or failure to the caller.
 * @author - Satish Joshi
 */

Accounts.prototype.referralLinkChain = function (referalLink, address, cb) {

	let referrer_address = referalLink;
	if (!referrer_address) {
		referrer_address = '';
	}
	let level = [];

	if (referrer_address == address) {
		let err = 'Introducer and sponsor can\'t be same';
		return setImmediate(cb, err);
	}

	async.series([

		function (callback) {
			if (referrer_address != '') {
				library.db.one(sql.validateReferSource, {
					referSource: referrer_address
				}).then(function (user) {
					if (parseInt(user.address)) {
						level.unshift(referrer_address);
						callback();
					} else {
						let error = 'Referral Link is Invalid';
						return setImmediate(cb, error);
					}
				}).catch(function (err) {
					return setImmediate(cb, err);
				});
			} else {
				callback();
			}
		},
		function (callback) {
			if (referrer_address != '') {
				library.logic.account.findReferralLevel(referrer_address, function (err, resp) {
					if (err) {
						return setImmediate(cb, err);
					}
					if (resp.length != 0 && resp[0].level != null) {
						let chain_length = ((resp[0].level.length) < 15) ? (resp[0].level.length) : 14;

						level = level.concat(resp[0].level.slice(0, chain_length));
					} else if (resp.length == 0) {
						return setImmediate(cb, "Referral link source is not eligible");
					}
					callback();
				});
			} else {
				callback();
			}
		},
		function (callback) {
			let levelDetails = {
				address: address,
				level: level
			};

			library.logic.account.insertLevel(levelDetails, function (err) {
				if (err) {
					return setImmediate(cb, err);
				}
				level.length = 0;
				callback();
			});
		}
	], function (err) {
		if (err) {
			setImmediate(cb, err);
		}

		return setImmediate(cb, null);
	});
};

/**
 * Gets accounts information, calls logic.account.getAll().
 * @implements module:accounts#Account~getAll
 * @param {Object} filter
 * @param {Object} fields
 * @param {function} cb - Callback function.
 */
Accounts.prototype.getAccounts = function (filter, fields, cb) {
	library.logic.account.getAll(filter, fields, cb);
};

/**
 * Validates input address and calls logic.account.set() and logic.account.get().
 * @implements module:accounts#Account~set
 * @implements module:accounts#Account~get
 * @param {Object} data - Contains address or public key to generate address.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} Errors.
 * @returns {function()} Call to logic.account.get().
 */
Accounts.prototype.setAccountAndGet = function (data, cb) {
	let address = data.address || null;
	let err;

	if (address === null) {
		if (data.publicKey) {
			address = self.generateAddressByPublicKey(data.publicKey);
		} else {
			err = 'Missing address or public key';
		}
	}

	if (!address) {
		err = 'Invalid public key';
	}

	if (err) {
		if (typeof cb === 'function') {
			return setImmediate(cb, err);
		} else {
			throw err;
		}
	}
	
	let REDIS_KEY_USER = "userAccountInfo_" + address;

	cache.prototype.isExists(REDIS_KEY_USER, function (err, isExist) { 
		if(!isExist) {
			cache.prototype.setJsonForKey(REDIS_KEY_USER, address);
		}

		library.logic.account.set(address, data, function (err) {
			if (err) {
				return setImmediate(cb, err);
			}
			return library.logic.account.get({ address: address }, cb);
		});
	});
};

/**
 * Validates input address and calls logic.account.merge().
 * @implements module:accounts#Account~merge
 * @param {Object} data - Contains address and public key.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} for errors wit address and public key.
 * @returns {function} calls to logic.account.merge().
 * @todo improve publicKey validation try/catch
 */
Accounts.prototype.mergeAccountAndGet = function (data, cb) {
	let address = data.address || null;
	let err;

	if (address === null) {
		if (data.publicKey) {
			address = self.generateAddressByPublicKey(data.publicKey);
		} else {
			err = 'Missing address or public key';
		}
	}

	if (!address) {
		err = 'Invalid public key';
	}

	if (err) {
		if (typeof cb === 'function') {
			return setImmediate(cb, err);
		} else {
			throw err;
		}
	}
	return library.logic.account.merge(address, data, cb);
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {} args - List of arguments.
 * @param {function} cb - Callback function.
 * @todo verified function and arguments.
 */
Accounts.prototype.sandboxApi = function (call, args, cb) {
	sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Calls Vote.bind() with scope.
 * @implements module:accounts#Vote~bind
 * @param {modules} scope - Loaded modules.
 */
Accounts.prototype.onBind = function (scope) {
	modules = {
		delegates: scope.delegates,
		accounts: scope.accounts,
		transactions: scope.transactions,
		blocks: scope.blocks
	};

	__private.assetTypes[transactionTypes.VOTE].bind(
		scope.delegates,
		scope.rounds,
		scope.accounts
	);
};
/**
 * Checks if modules is loaded.
 * @return {boolean} true if modules is loaded
 */
Accounts.prototype.isLoaded = function () {
	return !!modules;
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Accounts.prototype.shared = {
	open: function (req, cb) {
		library.schema.validate(req.body, schema.open, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			__private.openAccount(req.body.secret, function (err, account) {
				if (!err) {

					let payload = {
						secret: req.body.secret,
						address: account.address
					};
					let token = jwt.sign(payload, library.config.jwt.secret, {
						expiresIn: library.config.jwt.tokenLife,
						mutatePayload: false
					});

					let REDIS_KEY_USER_INFO_HASH = 'userAccountInfo_' + account.address;

					let accountData = {
						address: account.address,
						username: account.username,
						unconfirmedBalance: account.u_balance,
						balance: account.balance,
						publicKey: account.publicKey,
						unconfirmedSignature: account.u_secondSignature,
						secondSignature: account.secondSignature,
						secondPublicKey: account.secondPublicKey,
						multisignatures: account.multisignatures,
						u_multisignatures: account.u_multisignatures,
						totalFrozeAmount: account.totalFrozeAmount,
						groupBonus: account.group_bonus
					};

					accountData.token = token;

					if (req.body.email) {
						let mailOptions = {
							From: library.config.mailFrom,
							To: req.body.email,
							TemplateId: 8265220,
							TemplateModel: {
								"ddk": {
									"username": req.body.email,
									"ddk_address": accountData.address,
									"public_key": accountData.publicKey
								}
							}
						};
						(async function () {
							await mailServices.sendEmailWithTemplate(mailOptions, function (err) {
								if (err) {
									library.logger.error(err.stack);
									return setImmediate(cb, err.toString());
								}
							});
						})();
					}

					//library.cache.client.set('jwtToken_' + account.address, token, 'ex', 100);
					/****************************************************************/

					cache.prototype.isExists(REDIS_KEY_USER_INFO_HASH, function (err, isExist) {
						
						if (!isExist) {
							cache.prototype.setJsonForKey(REDIS_KEY_USER_INFO_HASH, accountData.address);
							self.referralLinkChain(req.body.referal, account.address, function (error) {
								if (error) {
									library.logger.error("Referral API Error : "+error);
									return setImmediate(cb, error.toString());
								} else {
									let data = {
										address: accountData.address,
										u_isDelegate: 0,
										isDelegate: 0,
										vote: 0,
										publicKey: accountData.publicKey,
									};
									if (account.u_isDelegate) {
										data.u_isDelegate = account.u_isDelegate;
									}
									if (account.isDelegate) {
										data.isDelegate = account.isDelegate;
									}
									if (account.vote) {
										data.vote = account.vote;
									}
									library.logic.account.set(accountData.address, data, function (error) {
										if (!error) {
											return setImmediate(cb, null, {
												account: accountData
											});

										} else {
											return setImmediate(cb, error);
										}
									});
								}
							});
						} else {
							if (req.body.etps_user) {
								library.db.none(sql.updateEtp, {
									transfer_time: slots.getTime(),
									address: accountData.address
								}).then(function () {
									return setImmediate(cb, null, {
										account: accountData
									});
								}).catch(function (err) {
									library.logger.error(err.stack);
									return setImmediate(cb, err);
								});
							} else {
								return setImmediate(cb, null, {
									account: accountData
								});
							}
						}
					});

				} else {
					return setImmediate(cb, err);
				}
			});
		});
	},

	getBalance: function (req, cb) {
		library.schema.validate(req.body, schema.getBalance, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			self.getAccount({ address: req.body.address }, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}

				let balance = account ? account.balance : '0';
				let unconfirmedBalance = account ? account.u_balance : '0';

				return setImmediate(cb, null, { balance: balance, unconfirmedBalance: unconfirmedBalance });
			});
		});
	},

	getPublickey: function (req, cb) {
		library.schema.validate(req.body, schema.getPublicKey, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			self.getAccount({ address: req.body.address }, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}

				if (!account || !account.publicKey) {
					return setImmediate(cb, 'Account not found');
				}

				return setImmediate(cb, null, { publicKey: account.publicKey });
			});
		});
	},

	generatePublicKey: function (req, cb) {
		library.schema.validate(req.body, schema.generatePublicKey, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			__private.openAccount(req.body.secret, function (err, account) {
				let publicKey = null;

				if (!err && account) {
					publicKey = account.publicKey;
				}

				return setImmediate(cb, err, {
					publicKey: publicKey
				});
			});
		});
	},

	getDelegates: function (req, cb) {
		library.schema.validate(req.body, schema.getDelegates, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			self.getAccount({ address: req.body.address }, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}

				if (!account) {
					return setImmediate(cb, 'Account not found');
				}

				if (account.delegates) {
					modules.delegates.getDelegates(req.body, function (err, res) {
						let delegates = res.delegates.filter(function (delegate) {
							return account.delegates.indexOf(delegate.publicKey) !== -1;
						});

						return setImmediate(cb, null, { delegates: delegates });
					});
				} else {
					return setImmediate(cb, null, { delegates: [] });
				}
			});
		});
	},

	getDelegatesFee: function (req, cb) {
		return setImmediate(cb, null, { fee: constants.fees.delegate });
	},

	addDelegates: function (req, cb) {
		library.schema.validate(req.body, schema.addDelegates, function (err) {
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

			library.balancesSequence.add(function (cb) {
				if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
					modules.accounts.getAccount({ publicKey: req.body.multisigAccountPublicKey }, function (err, account) {
						if (err) {
							return setImmediate(cb, err);
						}

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

							if (account.totalFrozeAmount === 0) {
								return setImmediate(cb, 'No Stake available');
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

							if (requester.totalFrozeAmount == 0) {
								return setImmediate(cb, 'Please Stake before vote/unvote');
							}

							let secondKeypair = null;

							if (requester.secondSignature) {
								let secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
								secondKeypair = library.ed.makeKeypair(secondHash);
							}

							let transactionVote;

							try {
								transactionVote = library.logic.transaction.create({
									type: transactionTypes.VOTE,
									votes: req.body.delegates,
									sender: account,
									keypair: keypair,
									secondKeypair: secondKeypair,
									requester: keypair
								});
							} catch (e) {
								return setImmediate(cb, e.toString());
							}

                            modules.transactions.receiveTransactions([transactionVote], true, cb);
						});
					});
				} else {
					self.setAccountAndGet({ publicKey: keypair.publicKey.toString('hex') }, function (err, account) {
						if (err) {
							return setImmediate(cb, err);
						}

						if (account.totalFrozeAmount === 0) {
							return setImmediate(cb, 'No Stake available');
						}

						if (!account || !account.publicKey) {
							return setImmediate(cb, 'Account not found');
						}

						if (account.secondSignature && !req.body.secondSecret) {
							return setImmediate(cb, 'Invalid second passphrase');
						}

						let secondKeypair = null;

						if (account.secondSignature) {
							let secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
							secondKeypair = library.ed.makeKeypair(secondHash);
						}

						if (account.totalFrozeAmount == 0) {
							return setImmediate(cb, 'Please Stake before vote/unvote');
						}

						let transactionVote;

						try {
							transactionVote = library.logic.transaction.create({
								type: transactionTypes.VOTE,
								votes: req.body.delegates,
								sender: account,
								keypair: keypair,
								secondKeypair: secondKeypair
							});
						} catch (e) {
							return setImmediate(cb, e.toString());
						}

                        modules.transactions.receiveTransactions([transactionVote], true, cb);
					});
				}
			}, function (err, transaction) {
				if (err) {
					return setImmediate(cb, err);
				}
				return setImmediate(cb, null, { transaction: transaction[0] });
				/* library.logic.vote.updateAndCheckVote({
					votes: req.body.delegates,
					senderId: transaction[0].senderId
				}, function (err) {
					if (err) {
						return setImmediate(cb, err);
					}
					return setImmediate(cb, null, { transaction: transaction[0] });
				}); */
			});
		});
	},

	getAccount: function (req, cb) {
		library.schema.validate(req.body, schema.getAccount, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			if (!req.body.address && !req.body.publicKey) {
				return setImmediate(cb, 'Missing required property: address or publicKey');
			}

			let address = req.body.publicKey ? self.generateAddressByPublicKey(req.body.publicKey) : req.body.address;
			if (req.body.address && req.body.publicKey && address !== req.body.address) {
				return setImmediate(cb, 'Account publicKey does not match address');
			}

			self.getAccount({ address: address }, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}

				if (!account) {
					return setImmediate(cb, 'Account not found');
				}

				return setImmediate(cb, null, {
					account: {
						address: account.address,
						unconfirmedBalance: account.u_balance,
						balance: account.balance,
						publicKey: account.publicKey,
						unconfirmedSignature: account.u_secondSignature,
						secondSignature: account.secondSignature,
						secondPublicKey: account.secondPublicKey,
						multisignatures: account.multisignatures || [],
						u_multisignatures: account.u_multisignatures || [],
						totalFrozeAmount: account.totalFrozeAmount
					}
				});
			});
		});
	},

	totalAccounts: function (req, cb) {
		library.db.one(sql.getTotalAccount)
			.then(function (data) {
				return setImmediate(cb, null, data);
			})
			.catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(cb, err.toString());
			});
	},

	getCirculatingSupply: function (req, cb) {
		let initialUnmined = config.ddkSupply.totalSupply - config.initialPrimined.total;
		//let publicAddress = library.config.sender.address;
		let hash = Buffer.from(JSON.parse(library.config.users[0].keys));
		let keypair = library.ed.makeKeypair(hash);
		let publicKey = keypair.publicKey.toString('hex');
		self.getAccount({publicKey: publicKey}, function(err, account) {
			library.db.one(sql.getCurrentUnmined, { address: account.address })
			.then(function (currentUnmined) {
				let circulatingSupply = config.initialPrimined.total + initialUnmined - currentUnmined.balance;

				cache.prototype.getJsonForKey('minedContributorsBalance', function (err, contributorsBalance) {
					let totalCirculatingSupply = parseInt(contributorsBalance) + circulatingSupply;

					return setImmediate(cb, null, {
						circulatingSupply: totalCirculatingSupply
					});
				});
			})
			.catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(cb, err.toString());
			});
		});
	},
	totalSupply: function (req, cb) {
		let totalSupply = config.ddkSupply.totalSupply;

		return setImmediate(cb, null, {
			totalSupply: totalSupply
		});

	},

	migrateData: function (req, cb) {

		try {
			var balance;
			if (req.body.data.balance_d === null) {
				balance = 0;
			} else {
				balance = parseFloat(req.body.data.balance_d) * 100000000;
			}
		} catch (err) {
			return setImmediate(cb, err.toString());
		}

		function getStakeOrderFromETPS(next) {
			library.db.query(sql.getETPSStakeOrders, {
				account_id: req.body.data.id
			})
				.then(function (orders) {
					next(null, orders);
				}).catch(function (err) {
					library.logger.error(err.stack);
					next(err, null);
				});
		}

		function insertstakeOrder(order, next) {

			let date = new Date((slots.getTime()) * 1000);
			let nextVoteMilestone = (date.setMinutes(date.getMinutes() + constants.froze.vTime)) / 1000;
            console.log('!!!!!! 3');
			library.db.none(sql.InsertStakeOrder, {
				account_id: req.body.data.id,
				startTime: (slots.getTime(order.insert_time)),
				insertTime: slots.getTime(),
				senderId: req.body.address,
				freezedAmount: order.cost * 100000000,
				rewardCount: order.month_count,
				status: 1,
				nextVoteMilestone: nextVoteMilestone
			})
				.then(function () {
					next(null, null);
				})
				.catch(function (err) {
					library.logger.error(err.stack);
					next(err, null);
				});
		}

		function insertStakeOrdersInETP(next, orders) {

			async.eachSeries(orders, function (order, eachSeriesCb) {

				insertstakeOrder(order, function (err) {
					if (err) {
						next(err, null);
					}else {
						eachSeriesCb();
					}
				});
			}, function (err) {
				next(err, null);
			});
		}

		function checkFrozeAmountsInStakeOrders(next) {

			library.db.one(sql.totalFrozeAmount, {
				account_id: (req.body.data.id).toString()
			})
				.then(function (totalFrozeAmount) {
					if (totalFrozeAmount) {
						next(null, totalFrozeAmount);
					} else {
						next(null, 0);
					}
				}).catch(function (err) {
					library.logger.error(err.stack);
					next(err, null);
				});
		}

		function updateMemAccountTable(next, totalFrozeAmount) {

			library.db.none(sql.updateUserInfo, {
				address: req.body.address,
				balance: parseInt(totalFrozeAmount.sum),
				email: req.body.data.email,
				phone: req.body.data.phone,
				username: req.body.data.username,
				country: req.body.data.country,
				totalFrozeAmount: parseInt(totalFrozeAmount.sum),
				group_bonus: req.body.group_bonus
			})
				.then(function () {
					next(null, null);
				})
				.catch(function (err) {
					library.logger.error(err.stack);
					next(err, null);
				});
		}

		function updateETPSUserDetail(next) {
			let date = new Date((slots.getRealTime()));

			library.db.none(sql.updateETPSUserInfo, {
				userId: req.body.data.id,
				insertTime: date
			})
				.then(function () {
					next(null, null);
				})
				.catch(function (err) {
					library.logger.error(err.stack);
					next(err, null);
				});
		}

		async.auto({
			getStakeOrderFromETPS: function (next) {
				getStakeOrderFromETPS(next);
			},
			insertStakeOrdersInETP: ['getStakeOrderFromETPS', function (results, next) {
				insertStakeOrdersInETP(next, results.getStakeOrderFromETPS);
			}],
			checkFrozeAmountsInStakeOrders: ['insertStakeOrdersInETP', function (results, next) {
				checkFrozeAmountsInStakeOrders(next, results);
			}],
			updateMemAccountTable: ['checkFrozeAmountsInStakeOrders', function (results, next) {
				updateMemAccountTable(next, results.checkFrozeAmountsInStakeOrders);
			}],
			updateETPSUserDetail: ['updateMemAccountTable', function (results, next) {
				updateETPSUserDetail(next, results);
			}]
		}, function (err) {
			if (err){
				library.logger.error(err.stack);
				return setImmediate(cb, err.toString());
			}	
			return setImmediate(cb, null, { success: true, message: 'Successfully migrated' });
		});

	},

	validateExistingUser: function (req, cb) {

		let data = req.body.data;
		let username = Buffer.from((data.split('&')[0]).split('=')[1], 'base64').toString();
		let password = Buffer.from((data.split('&')[1]).split('=')[1], 'base64').toString();

		let hashPassword = crypto.createHash('md5').update(password).digest('hex');

		library.db.one(sql.validateExistingUser, {
			username: username,
			password: hashPassword
		}).then(function (userInfo) {

			library.db.one(sql.findPassPhrase, {
				userName: username
			}).then(function (user) {
				
				return setImmediate(cb, null, {
					success: true,
					userInfo: user
				});
			}).catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(cb, 'Invalid username or password');
			});

		}).catch(function (err) {
			library.logger.error(err.stack);
			return setImmediate(cb, 'Invalid username or password');
		});

	},

	verifyUserToComment: function (req, cb) {
		if (!req.body.secret) {
			return setImmediate(cb, 'secret is missing');
		}
		let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
		let keypair = library.ed.makeKeypair(hash);
		let publicKey = keypair.publicKey.toString('hex');
		let address = self.generateAddressByPublicKey(publicKey);
		library.db.query(sql.findTrsUser, {
			senderId: address
		})
			.then(function (trs) {
				return setImmediate(cb, null, { address: trs[0].senderId });
			})
			.catch(function (err) {
				return setImmediate(cb, err);
			});
	},

	senderAccountBalance: function(req,cb) {
		library.db.query(sql.checkSenderBalance,{
			sender_address: req.body.address
		}).then(function(bal){
			return setImmediate(cb, null, { balance: bal[0].u_balance});
		}).catch(function(err){
			return setImmediate(cb, err);
		});
	},

	getMigratedUsersList: function (req, cb) {
		library.db.query(sql.getMigratedList, {
				limit: req.body.limit,
				offset: req.body.offset
			})
			.then(function (users) {
				return setImmediate(cb, null, {
					migratedList: users,
					count: users.length ? users[0].user_count : 0
				});
			}).catch(function (err) {
				return setImmediate(cb, err);
			});
	}
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Accounts.prototype.internal = {
	count: function (req, cb) {
		return setImmediate(cb, null, { success: true, count: Object.keys(__private.accounts).length });
	},

	top: function (query, cb) {
		self.getAccounts({
			sort: {
				balance: -1
			},
			offset: query.offset,
			limit: (query.limit || 100)
		}, function (err, raw) {
			if (err) {
				return setImmediate(cb, err);
			}

			let accounts = raw.map(function (account) {
				return {
					address: account.address,
					balance: account.balance,
					publicKey: account.publicKey
				};
			});

			return setImmediate(cb, null, { success: true, accounts: accounts });
		});
	},

	getAllAccounts: function (req, cb) {
		return setImmediate(cb, null, { success: true, accounts: __private.accounts });
	},

	lockAccount: function (req, cb) {
		library.schema.validate(req.body, schema.lockAccount, function (err) {
			if (!err) {
				if (!req.body.address) {
					return setImmediate(cb, 'Missing required property: address');
				}
				let address = req.body.publicKey ? self.generateAddressByPublicKey(req.body.publicKey) : req.body.address;
				self.getAccount({ address: address }, function (err, account) {
					if (err) {
						return setImmediate(cb, err);
					}
					if (!account) {
						let data = {};
						data.status = 0;
						data.address = req.body.address;
						data.publicKey = req.body.publicKey;
						if (req.body.accType) {
							data.acc_type = req.body.accType;
							let lastBlock = modules.blocks.lastBlock.get();
							data.endTime = library.logic.contract.calcEndTime(req.body.accType, lastBlock.timestamp);
							if (req.body.amount) {
								data.transferedAmount = req.body.amount;
							}
							let REDIS_KEY_USER_INFO_HASH = 'userInfo_' + data.address;
							let REDIS_KEY_USER_TIME_HASH = 'userTimeHash_' + data.endTime;
							cache.prototype.isExists(REDIS_KEY_USER_INFO_HASH, function (err, isExist) {
								if (!isExist) {
									let userInfo = {
										publicKey: data.publicKey,
										transferedAmount: data.transferedAmount,
										accType: req.body.accType
									};
									cache.prototype.hmset(REDIS_KEY_USER_INFO_HASH, userInfo);
									cache.prototype.hmset(REDIS_KEY_USER_TIME_HASH, userInfo);
									library.logic.contract.sendContractAmount([userInfo], function (err) {
										//FIXME: do further processing with "res" i.e send notification to the user
										if (err) {
											return setImmediate(cb, err);
										}
										library.logic.account.set(data.address, data, function (err) {
											if (!err) {
												data.startTime = lastBlock.timestamp;
												return setImmediate(cb, null, { account: data });
											} else {
												return setImmediate(cb, err);
											}
										});
									});
								} else {
									return setImmediate(cb, null, { account: data });
								}
							});
						}
					} else {
						library.db.one(sql.checkAccountStatus, {
							senderId: account.address
						})
							.then(function (row) {
								if (row.status === 0) {
									return cb('Account is already locked');
								}
								library.db.none(sql.disableAccount, {
									senderId: account.address
								})
									.then(function () {
										library.logger.info(account.address + ' account is locked');
										return setImmediate(cb, null, { account: account });
									})
									.catch(function (err) {
										library.logger.error(err.stack);
										return setImmediate(cb, err);
									});
							})
							.catch(function (err) {
								library.logger.error(err.stack);
								return setImmediate(cb, 'Transaction#checkAccountStatus error');
							});
					}
				});
			} else {
				return setImmediate(cb, err);
			}
		});
	},

	unlockAccount: function (req, cb) {
		library.schema.validate(req.body, schema.unlockAccount, function (err) {
			if (!err) {
				if (!req.body.address) {
					return setImmediate(cb, 'Missing required property: address');
				}

				let address = req.body.publicKey ? self.generateAddressByPublicKey(req.body.publicKey) : req.body.address;
				library.db.none(sql.enableAccount, {
					senderId: address
				})
					.then(function () {
						library.logger.info(address + ' account is unlocked');
						return setImmediate(cb, null);
					})
					.catch(function (err) {
						return setImmediate(cb, err);
					});
			} else {
				return setImmediate(cb, err);
			}
		});
	},

	logout: function (req, cb) {
		delete req.decoded;
		return setImmediate(cb, null);
	},

	generateQRCode: function (req, cb) {
		let user = {};
		if (!req.body.publicKey) {
			return setImmediate(cb, 'Missing address or public key');
		}
		user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
		let secret = speakeasy.generateSecret({ length: 30 });
		QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
			user.twofactor = {
				secret: '',
				tempSecret: secret.base32,
				dataURL: data_url,
				otpURL: secret.otpauth_url
			};
			library.cache.client.set('2fa_user_' + user.address, JSON.stringify(user));
			return setImmediate(cb, null, { success: true, dataUrl: data_url });
		});
	},

	verifyOTP: function (req, cb) {
		let user = {};
		if (!req.body.publicKey) {
			return setImmediate(cb, 'Missing address or public key');
		}
		user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
		library.cache.client.get('2fa_user_' + user.address, function (err, userCred) {
			if (!userCred) {
				return setImmediate(cb, 'Token expired or invalid OTP. Click resend to continue');
			}
			if (err) {
				return setImmediate(cb, err);
			}
			let user_2FA = JSON.parse(userCred);
			let verified = speakeasy.totp.verify({
				secret: user_2FA.twofactor.tempSecret,
				encoding: 'base32',
				token: req.body.otp,
				window: 6
			});
			if (!verified) {
				return setImmediate(cb, 'Invalid OTP!. Please enter valid OTP to SEND Transaction');
			}
			return setImmediate(cb, null, { success: true, key: user_2FA.twofactor.tempSecret });
		});
	},

	enableTwoFactor: function (req, cb) {
		let user = {};
		if (!req.body.key) {
			return setImmediate(cb, 'Key is missing');
		}
		if (!req.body.secret) {
			return setImmediate(cb, 'secret is missing');
		}
		if (!req.body.otp) {
			return setImmediate(cb, 'otp is missing');
		}
		let hash = crypto.createHash('sha256').update(req.body.secret, 'utf8').digest();
		let keypair = library.ed.makeKeypair(hash);
		let publicKey = keypair.publicKey.toString('hex');
		user.address = modules.accounts.generateAddressByPublicKey(publicKey);
		library.cache.client.get('2fa_user_' + user.address, function (err, userCred) {
			if (err) {
				return setImmediate(cb, err);
			}
			if (!userCred) {
				return setImmediate(cb, 'Key expired');
			}
			let user_2FA = JSON.parse(userCred);
			let verified = speakeasy.totp.verify({
				secret: req.body.key,
				encoding: 'base32',
				token: req.body.otp,
				window: 6
			});
			if (!verified) {
				return setImmediate(cb, 'Invalid OTP!. Please enter valid OTP to SEND Transaction');
			}
			user_2FA.twofactor.secret = req.body.key;
			library.cache.client.set('2fa_user_' + user.address, JSON.stringify(user_2FA));
			return setImmediate(cb, null, { success: true, key: user_2FA.twofactor.tempSecret });
		});
	},

	disableTwoFactor: function (req, cb) {
		let user = {};
		if (!req.body.publicKey) {
			return setImmediate(cb, 'Missing address or public key');
		}
		user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
		library.cache.client.exists('2fa_user_' + user.address, function (err, isExist) {
			if (isExist) {
				library.cache.client.del('2fa_user_' + user.address);
			}
			return setImmediate(cb, null, { success: true, message: 'Two Factor Authentication Disabled For ' + user.address });
		});
	},

	checkTwoFactorStatus: function (req, cb) {
		let user = {};
		if (!req.body.publicKey) {
			return setImmediate(cb, 'Missing address or public key');
		}
		user.address = modules.accounts.generateAddressByPublicKey(req.body.publicKey);
		library.cache.client.exists('2fa_user_' + user.address, function (err, isExist) {
			if (isExist) {
				library.cache.client.get('2fa_user_' + user.address, function (err, userCred) {
					let user_2FA = JSON.parse(userCred);
					if(user_2FA.twofactor.secret) {
						return setImmediate(cb, null, { success: true });
					}
					return setImmediate(cb, null, { success: false });
				});
			}else {
				return setImmediate(cb, null, { success: false });
			}
		});
	},
	generatenpNewPassphase: function (req, cb) {
		let code = new Mnemonic(Mnemonic.Words.ENGLISH);
		code = code.toString();
		return setImmediate(cb, null, { success: true, passphase: code });
	},

	getWithdrawlStatus: function (req, cb) {
		library.schema.validate(req.body, schema.enablePendingGroupBonus, function (err) {
			if (err) {
				return setImmediate(cb, err);
			}

			var stakedAmount = 0, groupBonus = 0, pendingGroupBonus = 0, failedRule = [];
			async.auto({
				checkLastWithdrawl: function (seriesCb) {
					library.cache.client.exists(req.body.address + '_pending_group_bonus_trs_id', function (err, isExists) {
						if (isExists) {
							library.cache.client.get(req.body.address + '_pending_group_bonus_trs_id', function (err, transactionId) {
								if (err) {
									//failedRule[0] = false;
									seriesCb(null, false);
								}
								library.db.one(sql.findTrs, {
									transactionId: transactionId
								})
									.then(function (transationData) {
										let d = constants.epochTime;
										let t = parseInt(d.getTime() / 1000);
										d = new Date((transationData.timestamp + t) * 1000);
										const timeDiff = (d - Date.now());
										const days = Math.ceil(Math.abs(timeDiff / (1000 * 60 * 60 * 24)));
										if (days > 7) {
											seriesCb(null, true);
										} else {
											seriesCb(null, false);
										}
									})
									.catch(function (err) {
										seriesCb(err, false);
									});
							});
						} else {
							seriesCb(null, true);
						}
					});
				},
				checkActiveStake: ['checkLastWithdrawl', function (result, seriesCb) {
					library.db.query(sql.findActiveStakeAmount, {
						senderId: req.body.address
					})
					.then(function (stakeOrders) {
						if (stakeOrders.length > 0) {
							stakedAmount = parseInt(stakeOrders[1].value) / 100000000;
							seriesCb(null, true);
						} else {
							seriesCb(null, false);
							//seriesCb('Rule 2 failed: You need to have at least one active stake order');
						}
					})
					.catch(function (err) {
						seriesCb(err, false);
					});
				}],
				checkActiveStakeOfLeftAndRightSponsor: ['checkActiveStake', function (result, seriesCb) {
					library.db.query(sql.findDirectSponsor, {
						introducer: req.body.address
					})
						.then(function (directSponsors) {
							if (directSponsors.length >= 2) {

								var activeStakeCount = 0;
								directSponsors.forEach(function (directSponsor) {
									library.db.query(sql.findActiveStakeAmount, {
										senderId: directSponsor.address
									})
										.then(function (stakeInfo) {
											const timeDiff = (slots.getTime() - stakeInfo[0].value);
											const days = Math.ceil(Math.abs(timeDiff / (1000 * 60 * 60 * 24)));
											if (stakedAmount && days <= 31) {
												activeStakeCount++;
											}
											if (activeStakeCount >= 2) {
												seriesCb(null, true);
											}
										})
										.catch(function (err) {
											seriesCb(err, false);
										});
								});
								
							} else if(activeStakeCount < 2){
								seriesCb(null, false);
							}else {
								seriesCb(null, false);
							}
						})
						.catch(function (err) {
							seriesCb(err, false);
						});
				}],
				checkRatio: ['checkActiveStakeOfLeftAndRightSponsor', function (result, seriesCb) {

					library.db.query(sql.findGroupBonus, {
						senderId: req.body.address
					})
					.then(function (bonusInfo) {
						groupBonus = parseInt(bonusInfo[0].group_bonus) / 100000000 ;
						pendingGroupBonus = parseInt(bonusInfo[0].pending_group_bonus) / 100000000;
						if (pendingGroupBonus <= groupBonus && pendingGroupBonus > 0) {
							nextBonus = (groupBonus - pendingGroupBonus) > 15 ? 15 : (groupBonus - pendingGroupBonus) !== 0 ? (groupBonus - pendingGroupBonus) : 15;
							if(nextBonus > stakedAmount * 10) {
								nextBonus = stakedAmount * 10;
								pendingGroupBonus = groupBonus - nextBonus;
								seriesCb(null, true);
							} else if ((groupBonus - pendingGroupBonus + nextBonus) < stakedAmount * 10) {
								pendingGroupBonus = groupBonus - nextBonus;
								seriesCb(null, true);
							} else if(stakedAmount * 10 - (groupBonus - pendingGroupBonus) > 0) {
								nextBonus = stakedAmount * 10 - (groupBonus - pendingGroupBonus);
								pendingGroupBonus = groupBonus - nextBonus;
								seriesCb(null, true);
							} else {
								seriesCb(null, false);
								//seriesCb('Rule 4 failed: Ratio withdrawal is 1:10 from own staking DDK.');
							}
						} else {
							seriesCb(null, false);
							//seriesCb('Either you don\'t have group bonus reserved or exhausted your withdrawl limit');
						}
					})
					.catch(function (err) {
						seriesCb(err, false);
					});
				}]
			}, function (err, data) {
				if (err) {
					return setImmediate(cb, err, { success: false, status: data });
				}
				return setImmediate(cb, null, { success: true, status: data });
			});
		});
	},

	sendWithdrawlAmount: function (req, cb) {
		library.schema.validate(req.body, schema.enablePendingGroupBonus, function (err) {
			if (err) {
				return setImmediate(cb, err);
			}
			if (!nextBonus) {
				return setImmediate(cb, 'You don\'t have pending group bonus remaining');
			}
			let hash = Buffer.from(JSON.parse(library.config.users[5].keys));
			let keypair = library.ed.makeKeypair(hash);
			let publicKey = keypair.publicKey.toString('hex');
			library.balancesSequence.add(function (cb) {
				self.getAccount({publicKey: publicKey}, function(err, account) {
					if (err) {
						return setImmediate(cb, err)
					}
					let transaction;
					let secondKeypair = null;
					account.publicKey = publicKey;
	
					try {
						transaction = library.logic.transaction.create({
							type: transactionTypes.REWARD,
							amount: nextBonus * 100000000,
							sender: account,
							recipientId: req.body.address,
							keypair: keypair,
							secondKeypair: secondKeypair,
							trsName: 'WITHDRAWLREWARD'
						});
					} catch (e) {
						return setImmediate(cb, e.toString());
					}
					modules.transactions.receiveTransactions([transaction], true, cb);
				});
			}, function (err, transaction) {
				if (err) {
					return setImmediate(cb, err);
				}
				library.cache.client.set(req.body.address + '_pending_group_bonus_trs_id', transaction[0].id);
				library.db.none(sql.updatePendingGroupBonus, {
					nextBonus: nextBonus * 100000000,
					senderId: req.body.address
				})
				.then(function () {
					return setImmediate(cb, null, { transactionId: transaction[0].id });
				})
				.catch(function (err) {
					return setImmediate(cb, err);
				});
			});
		});
	},

	forgotEtpsPassword: function (req, cb) {
		let data = req.body.data;
		let userName = Buffer.from((data.split('&')[0]).split('=')[1], 'base64').toString();
		let email = Buffer.from((data.split('&')[1]).split('=')[1], 'base64').toString();
		let link = req.body.link;

		library.db.one(sql.validateEtpsUser, {
			username: userName,
			emailId: email
		}).then(function (user) {
			let newPassword = Math.random().toString(36).substr(2, 8);
			let hash = crypto.createHash('md5').update(newPassword).digest('hex');

			library.db.none(sql.updateEtpsPassword, {
				password: hash,
				username: userName
			}).then(function () {

				let mailOptions = {
					From: library.config.mailFrom,
					To: email,
					TemplateId: 8276287,
					TemplateModel: {
						"ddk": {
						  "username": userName,
						  "password": newPassword
						}
					  }
				};

				mailServices.sendEmailWithTemplate(mailOptions, function (err) {
					if (err) {
						library.logger.error(err.stack);
						return setImmediate(cb, err.toString());
					}
					return setImmediate(cb, null, {
						success: true,
						info: "Mail Sent Successfully"
					});
				});
			}).catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(cb, err);
			});

		}).catch(function (err) {
			library.logger.error(err.stack);
			return setImmediate(cb, 'Invalid username or email');
		});

	}
};

// Export
module.exports = Accounts;

/*************************************** END OF FILE *************************************/
