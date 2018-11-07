

let _ = require('lodash');
let async = require('async');
let bignum = require('../helpers/bignum.js');
let BlockReward = require('../logic/blockReward.js');
let checkIpInList = require('../helpers/checkIpInList.js');
let constants = require('../helpers/constants.js');
let jobsQueue = require('../helpers/jobsQueue.js');
let crypto = require('crypto');
let Delegate = require('../logic/delegate.js');
let OrderBy = require('../helpers/orderBy.js');
let sandboxHelper = require('../helpers/sandbox.js');
let schema = require('../schema/delegates.js');
let slots = require('../helpers/slots.js');
let sql = require('../sql/delegates.js');
let transactionTypes = require('../helpers/transactionTypes.js');

// Private fields
let modules, library, self, __private = {}, shared = {};

__private.assetTypes = {};
__private.loaded = false;
__private.blockReward = new BlockReward();
__private.keypairs = {};
__private.tmpKeypairs = {};

/**
 * Initializes library with scope content and generates a Delegate instance.
 * Calls logic.transaction.attachAssetType().
 * @memberof module:delegates
 * @class
 * @classdesc Main delegates methods.
 * @param {scope} scope - App instance.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function Delegates (cb, scope) {
	library = {
		logger: scope.logger,
		sequence: scope.sequence,
		ed: scope.ed,
		db: scope.db,
		network: scope.network,
		schema: scope.schema,
		balancesSequence: scope.balancesSequence,
		logic: {
			transaction: scope.logic.transaction,
		},
		config: {
			forging: {
				secret: scope.config.forging.secret,
				access: {
					whiteList: scope.config.forging.access.whiteList,
				},
			},
		},
	};
	self = this;

	__private.assetTypes[transactionTypes.DELEGATE] = library.logic.transaction.attachAssetType(
		transactionTypes.DELEGATE,
		new Delegate(
			scope.schema
		)
	);

	setImmediate(cb, null, self);
}

// Private methods
/**
 * Gets delegate public keys sorted by vote descending.
 * @private
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback}
 */
__private.getKeysSortByVote = function (cb) {
	modules.accounts.getAccounts({
		isDelegate: 1,
		sort: {'voteCount':-1,'vote': -1, 'publicKey': 1},
		limit: slots.delegates
	}, ['publicKey'], function (err, rows) {
		if (err) {
			return setImmediate(cb, err);
		}
		return setImmediate(cb, null, rows.map(function (el) {
			return el.publicKey;
		}));
	});
};

/**
 * Gets slot time and keypair.
 * @private
 * @param {number} slot
 * @param {number} height
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error | cb | object {time, keypair}.
 */
__private.getBlockSlotData = function (slot, height, cb) {
	self.generateDelegateList(height, function (err, activeDelegates) {
		if (err) {
			return setImmediate(cb, err);
		}

		let currentSlot = slot;
		let lastSlot = slots.getLastSlot(currentSlot);

		for (; currentSlot < lastSlot; currentSlot += 1) {
			let delegate_pos = currentSlot % slots.delegates;
			let delegate_id = activeDelegates[delegate_pos];

			if (delegate_id && __private.keypairs[delegate_id]) {
				return setImmediate(cb, null, {time: slots.getSlotTime(currentSlot), keypair: __private.keypairs[delegate_id]});
			}
		}

		return setImmediate(cb, null, null);
	});
};

/**
 * Gets peers, checks consensus and generates new block, once delegates
 * are enabled, client is ready to forge and is the correct slot.
 * @private
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback}
 */
__private.forge = function (cb) {
	if (!Object.keys(__private.keypairs).length) {
		library.logger.debug('No delegates enabled');
		return __private.loadDelegates(cb);
	}

	// When client is not loaded, is syncing or round is ticking
	// Do not try to forge new blocks as client is not ready
	if (!__private.loaded || modules.loader.syncing() || !modules.rounds.loaded() || modules.rounds.ticking()) {
		library.logger.debug('Client not ready to forge');
		return setImmediate(cb);
	}

	let currentSlot = slots.getSlotNumber();
	let lastBlock = modules.blocks.lastBlock.get();

	if (currentSlot === slots.getSlotNumber(lastBlock.timestamp)) {
		library.logger.debug('Waiting for next delegate slot');
		return setImmediate(cb);
	}

	__private.getBlockSlotData(currentSlot, lastBlock.height + 1, function (err, currentBlockData) {
		if (err || currentBlockData === null) {
			library.logger.warn('Skipping delegate slot', err);
			return setImmediate(cb);
		}

		if (slots.getSlotNumber(currentBlockData.time) !== slots.getSlotNumber()) {
			library.logger.debug('Delegate slot', slots.getSlotNumber());
			return setImmediate(cb);
		}

		library.sequence.add(function (cb) {
			async.series({
				getPeers: function (seriesCb) {
					return modules.transport.getPeers({limit: constants.maxPeers}, seriesCb);
				},
				checkBroadhash: function (seriesCb) {
					if (modules.transport.poorConsensus()) {
						return setImmediate(seriesCb, ['Inadequate broadhash consensus', modules.transport.consensus(), '%'].join(' '));
					} else {
						return setImmediate(seriesCb);
					}
				}
			}, function (err) {
				if (err) {
					library.logger.warn(err);
					return setImmediate(cb, err);
				} else {
					return modules.blocks.process.generateBlock(currentBlockData.keypair, currentBlockData.time, cb);
				}
			});
		}, function (err) {
			if (err) {
				library.logger.error('Failed to generate block within delegate slot', err);
			} else {

				let forgedBlock = modules.blocks.lastBlock.get();
				modules.blocks.lastReceipt.update();

				library.logger.info([
					'Forged new block id:', forgedBlock.id,
					'height:', forgedBlock.height,
					'round:', modules.rounds.calc(forgedBlock.height),
					'slot:', slots.getSlotNumber(currentBlockData.time),
					'reward:' + forgedBlock.reward
				].join(' '));
			}

			return setImmediate(cb);
		});
	});
};

/**
 * Checks each vote integrity and controls total votes don't exceed active delegates.
 * Calls modules.accounts.getAccount() to validate delegate account and votes accounts.
 * @private
 * @implements module:accounts#Account#getAccount
 * @param {publicKey} publicKey
 * @param {Array} votes
 * @param {string} state - 'confirmed' to delegates, otherwise u_delegates.
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} cb | error messages
 */
__private.checkDelegates = function (publicKey, votes, state, cb) {
	if (!Array.isArray(votes)) {
		return setImmediate(cb, 'Votes must be an array');
	}

	modules.accounts.getAccount({publicKey: publicKey}, function (err, account) {
		if (err) {
			return setImmediate(cb, err);
		}

		if (!account) {
			return setImmediate(cb, 'Account not found');
		}

		let delegates = (state === 'confirmed') ? account.delegates : account.u_delegates;
		let existing_votes = Array.isArray(delegates) ? delegates.length : 0;
		let additions = 0, removals = 0;

		async.eachSeries(votes, function (action, cb) {
			let math = action[0];

			if (math === '+') {
				additions += 1;
			} else if (math === '-') {
				removals += 1;
			} else {
				return setImmediate(cb, 'Invalid math operator');
			}

			let publicKey = action.slice(1);

			try {
				Buffer.from(publicKey, 'hex');
			} catch (e) {
				library.logger.error(e.stack);
				return setImmediate(cb, 'Invalid public key');
			}

			if (math === '+' && (delegates != null && delegates.indexOf(publicKey) !== -1)) {
				return setImmediate(cb, 'Failed to add vote, account has already voted for this delegate');
			}

			if (math === '-' && (delegates === null || delegates.indexOf(publicKey) === -1)) {
				return setImmediate(cb, 'Failed to remove vote, account has not voted for this delegate');
			}

			modules.accounts.getAccount({ publicKey: publicKey, isDelegate: 1 }, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}

				if (!account) {
					return setImmediate(cb, 'Delegate not found');
				}

				return setImmediate(cb);
			});
		}, function (err) {
			if (err) {
				return setImmediate(cb, err);
			}

			let total_votes = (existing_votes + additions) - removals;

			if (total_votes > constants.maxVotes) {
				let exceeded = total_votes - constants.maxVotes;

				return setImmediate(cb, 'Maximum number of votes possible ' + constants.maxVotes + ', exceeded by ' + exceeded );
			} else {
				return setImmediate(cb);
			}
		});
	});
};

/**
 * Loads delegates from config and stores in private `keypairs`.
 * @private
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback}
 */
__private.loadDelegates = function (cb) {
	let secrets;

	if (library.config.forging.secret) {
		if (Array.isArray(library.config.forging.secret)) {
			secrets = library.config.forging.secret;
		} else {
			secrets = [library.config.forging.secret];
		}
	}

	if (!secrets || !secrets.length) {
		return setImmediate(cb);
	} else {
		library.logger.info(['Loading', secrets.length, 'delegates from config'].join(' '));
	}

	async.eachSeries(secrets, function (secret, cb) {
		let keypair = library.ed.makeKeypair(crypto.createHash('sha256').update(secret, 'utf8').digest());

		modules.accounts.getAccount({
			publicKey: keypair.publicKey.toString('hex')
		}, function (err, account) {
			if (err) {
				return setImmediate(cb, err);
			}

			if (!account) {
				return setImmediate(cb, ['Account with public key:', keypair.publicKey.toString('hex'), 'not found'].join(' '));
			}

			if (account.isDelegate) {
				__private.keypairs[keypair.publicKey.toString('hex')] = keypair;
				library.logger.info(['Forging enabled on account:', account.address].join(' '));
			} else {
				library.logger.warn(['Account with public key:', keypair.publicKey.toString('hex'), 'is not a delegate'].join(' '));
			}

			return setImmediate(cb);
		});
	}, cb);
};

// Public methods
/**
 * Gets delegate list by vote and changes order.
 * @param {number} height
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} err | truncated delegate list.
 * @todo explain seed.
 */
Delegates.prototype.generateDelegateList = function (height, cb) {
	__private.getKeysSortByVote(function (err, truncDelegateList) {
		if (err) {
			return setImmediate(cb, err);
		}

		let seedSource = modules.rounds.calc(height).toString();
		let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest();

		for (let i = 0, delCount = truncDelegateList.length; i < delCount; i++) {
			for (let x = 0; x < 4 && i < delCount; i++, x++) {
				let newIndex = currentSeed[x] % delCount;
				let b = truncDelegateList[newIndex];
				truncDelegateList[newIndex] = truncDelegateList[i];
				truncDelegateList[i] = b;
			}
			currentSeed = crypto.createHash('sha256').update(currentSeed).digest();
		}

		return setImmediate(cb, null, truncDelegateList);
	});
};

/**
 * Gets delegates and for each one calculates rate, rank, approval, productivity.
 * Orders delegates as per criteria.
 * @param {Object} query
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error| object with delegates ordered, offset, count, limit.
 * @todo OrderBy does not affects data? What is the impact?.
 */
Delegates.prototype.getDelegates = function (query, cb) {
	if (!query) {
		throw 'Missing query argument';
	}
	modules.accounts.getAccounts({
		isDelegate: 1,
		sort: {'voteCount':-1,'vote': -1, 'publicKey': 1}
	}, ['username', 'address', 'publicKey', 'vote', 'missedblocks', 'producedblocks', 'url'], function (err, delegates) {
		if (err) {
			return setImmediate(cb, err);
		}

		let limit = query.limit || constants.activeDelegates;
		let offset = query.offset || 0;

		limit = limit > constants.activeDelegates ? constants.activeDelegates : limit;

		let count = delegates.length;
		let realLimit = Math.min(offset + limit, count);

		let lastBlock = modules.blocks.lastBlock.get(),
			totalSupply = __private.blockReward.calcSupply(lastBlock.height);

		for (let i = 0; i < delegates.length; i++) {
			// TODO: 'rate' property is deprecated and need to be removed after transitional period
			delegates[i].rate = i + 1;
			delegates[i].rank = i + 1;
			delegates[i].approval = (delegates[i].vote / totalSupply) * 100;
			delegates[i].approval = Math.round(delegates[i].approval * 1e2) / 1e2;

			let percent = 100 - (delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100));
			percent = Math.abs(percent) || 0;

			let outsider = i + 1 > slots.delegates;
			delegates[i].productivity = (!outsider) ? Math.round(percent * 1e2) / 1e2 : 0;
		}

		let orderBy = OrderBy(query.orderBy, {quoteField: false});

		if (orderBy.error) {
			return setImmediate(cb, orderBy.error);
		}

		return setImmediate(cb, null, {
			delegates: delegates,
			sortField: orderBy.sortField,
			sortMethod: orderBy.sortMethod,
			count: count,
			offset: offset,
			limit: realLimit
		});
	});
};

/**
 * @param {publicKey} publicKey
 * @param {Array} votes
 * @param {function} cb
 * @return {function} Calls checkDelegates() with 'confirmed' state.
 */
Delegates.prototype.checkConfirmedDelegates = function (publicKey, votes, cb) {
	return __private.checkDelegates(publicKey, votes, 'confirmed', cb);
};

/**
 * @param {publicKey} publicKey
 * @param {Array} votes
 * @param {function} cb
 * @return {function} Calls checkDelegates() with 'unconfirmed' state.
 */
Delegates.prototype.checkUnconfirmedDelegates = function (publicKey, votes, cb) {
	return __private.checkDelegates(publicKey, votes, 'unconfirmed', cb);
};

/**
 * Inserts a fork into 'forks_stat' table and emits a 'delegates/fork' socket signal
 * with fork data: cause + block.
 * @param {block} block
 * @param {string} cause
 */
Delegates.prototype.fork = function (block, cause) {
	library.logger.info('Fork', {
		delegate: block.generatorPublicKey,
		block: { id: block.id, timestamp: block.timestamp, height: block.height, previousBlock: block.previousBlock },
		cause: cause
	});

	let fork = {
		delegatePublicKey: block.generatorPublicKey,
		blockTimestamp: block.timestamp,
		blockId: block.id,
		blockHeight: block.height,
		previousBlock: block.previousBlock,
		cause: cause
	};

	library.db.none(sql.insertFork, fork).then(function () {
		library.network.io.sockets.emit('delegates/fork', fork);
	});
};

/**
 * Generates delegate list and checks if block generator public Key
 * matches delegate id.
 * @param {block} block
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback} error message | cb
 */
Delegates.prototype.validateBlockSlot = function (block, cb) {
	self.generateDelegateList(block.height, function (err, activeDelegates) {
		if (err) {
			return setImmediate(cb, err);
		}

		let currentSlot = slots.getSlotNumber(block.timestamp);
		let delegate_id = activeDelegates[currentSlot % slots.delegates];
		// let nextDelegate_id = activeDelegates[(currentSlot + 1) % slots.delegates];
		// let previousDelegate_id = activeDelegates[(currentSlot - 1) % slots.delegates];

		if (delegate_id && block.generatorPublicKey === delegate_id) {
			return setImmediate(cb);
		} else {
			library.logger.error('Expected generator: ' + delegate_id + ' Received generator: ' + block.generatorPublicKey);
			return setImmediate(cb, 'Failed to verify slot: ' + currentSlot);
		}
	});
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Delegates.prototype.sandboxApi = function (call, args, cb) {
	sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Calls Delegate.bind() with scope.
 * @implements module:delegates#Delegate~bind
 * @param {modules} scope - Loaded modules.
 */
Delegates.prototype.onBind = function (scope) {
	modules = {
		loader: scope.loader,
		rounds: scope.rounds,
		accounts: scope.accounts,
		blocks: scope.blocks,
		transport: scope.transport,
		transactions: scope.transactions,
		delegates: scope.delegates,
	};

	__private.assetTypes[transactionTypes.DELEGATE].bind(
		scope.accounts
	);
};

/**
 * Loads delegates.
 * @implements module:transactions#Transactions~fillPool
 */
Delegates.prototype.onBlockchainReady = function () {
	__private.loaded = true;

	__private.loadDelegates(function (err) {

		function nextForge (cb) {
			if (err) {
				library.logger.error('Failed to load delegates', err);
			}

			async.series([
				__private.forge,
				modules.transactions.fillPool
			], function () {
				return setImmediate(cb);
			});
		}

		jobsQueue.register('delegatesNextForge', nextForge, 1000);
	});
};

/**
 * Sets loaded to false.
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} Returns cb.
 */
Delegates.prototype.cleanup = function (cb) {
	__private.loaded = false;
	return setImmediate(cb);
};

/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
Delegates.prototype.isLoaded = function () {
	return !!modules;
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Delegates.prototype.internal = {
	forgingEnable: function (req, cb) {
		library.schema.validate(req.body, schema.enableForging, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			let keypair = library.ed.makeKeypair(crypto.createHash('sha256').update(req.body.secret, 'utf8').digest());

			if (req.body.publicKey) {
				if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
					return setImmediate(cb, 'Invalid passphrase');
				}
			}

			if (__private.keypairs[keypair.publicKey.toString('hex')]) {
				return setImmediate(cb, 'Forging is already enabled');
			}

			modules.accounts.getAccount({publicKey: keypair.publicKey.toString('hex')}, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}
				if (account && account.isDelegate) {
					__private.keypairs[keypair.publicKey.toString('hex')] = keypair;
					library.logger.info('Forging enabled on account: ' + account.address);
					return setImmediate(cb, null, {address: account.address});
				} else {
					return setImmediate(cb, 'Delegate not found');
				}
			});
		});
	},

	forgingDisable: function (req, cb) {
		library.schema.validate(req.body, schema.disableForging, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			let keypair = library.ed.makeKeypair(crypto.createHash('sha256').update(req.body.secret, 'utf8').digest());

			if (req.body.publicKey) {
				if (keypair.publicKey.toString('hex') !== req.body.publicKey) {
					return setImmediate(cb, 'Invalid passphrase');
				}
			}

			if (!__private.keypairs[keypair.publicKey.toString('hex')]) {
				return setImmediate(cb, 'Delegate not found');
			}

			modules.accounts.getAccount({publicKey: keypair.publicKey.toString('hex')}, function (err, account) {
				if (err) {
					return setImmediate(cb, err);
				}
				if (account && account.isDelegate) {
					delete __private.keypairs[keypair.publicKey.toString('hex')];
					library.logger.info('Forging disabled on account: ' + account.address);
					return setImmediate(cb, null, {address: account.address});
				} else {
					return setImmediate(cb, 'Delegate not found');
				}
			});
		});
	},

	forgingStatus: function (req, cb) {
		if (!checkIpInList(library.config.forging.access.whiteList, req.ip)) {
			return setImmediate(cb, 'Access denied');
		}

		library.schema.validate(req.body, schema.forgingStatus, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			if (req.body.publicKey) {
				return setImmediate(cb, null, {enabled: !!__private.keypairs[req.body.publicKey]});
			} else {
				let delegates_cnt = _.keys(__private.keypairs).length;
				return setImmediate(cb, null, {enabled: delegates_cnt > 0, delegates: _.keys(__private.keypairs)});
			}
		});
	},

	forgingEnableAll: function (req, cb) {
		if (Object.keys(__private.tmpKeypairs).length === 0) {
			return setImmediate(cb, 'No delegate keypairs defined');
		}

		__private.keypairs = __private.tmpKeypairs;
		__private.tmpKeypairs = {};
		return setImmediate(cb);
	},

	forgingDisableAll: function (req, cb) {
		if (Object.keys(__private.tmpKeypairs).length !== 0) {
			return setImmediate(cb, 'Delegate keypairs are defined');
		}

		__private.tmpKeypairs = __private.keypairs;
		__private.keypairs = {};
		return setImmediate(cb);
	},

	getLatestVoters: function(req, cb) {
		library.db.query(sql.getLatestVoters, {
			limit: req.body.limit
		})
		.then(function(voters) {
			return setImmediate(cb, null, { voters: voters });
		})
		.catch(function(err) {
			return setImmediate(cb, err);
		});
	},

	getLatestDelegates: function(req, cb) {
		library.db.query(sql.getLatestDelegates, {
			limit: req.body.limit
		})
		.then(function(delegates) {
			return setImmediate(cb, null, { delegates: delegates });
		})
		.catch(function(err) {
			return setImmediate(cb, err);
		});
	}
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Delegates.prototype.shared = {
	getDelegate: function (req, cb) {
		library.schema.validate(req.body, schema.getDelegate, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			modules.delegates.getDelegates(req.body, function (err, data) {
				if (err) {
					return setImmediate(cb, err);
				}

				let delegate = _.find(data.delegates, function (delegate) {
					if (req.body.publicKey) {
						return delegate.publicKey === req.body.publicKey;
					} else if (req.body.username) {
						return delegate.username === req.body.username;
					}

					return false;
				});

				if (delegate) {
					return setImmediate(cb, null, {delegate: delegate});
				} else {
					return setImmediate(cb, 'Delegate not found');
				}
			});
		});
	},

	getNextForgers: function (req, cb) {
		let currentBlock = modules.blocks.lastBlock.get();
		let limit = req.body.limit || 10;

		modules.delegates.generateDelegateList(currentBlock.height, function (err, activeDelegates) {
			if (err) {
				return setImmediate(cb, err);
			}

			let currentBlockSlot = slots.getSlotNumber(currentBlock.timestamp);
			let currentSlot = slots.getSlotNumber();
			let nextForgers = [];

			for (let i = 1; i <= slots.delegates && i <= limit; i++) {
				if (activeDelegates[(currentSlot + i) % slots.delegates]) {
					nextForgers.push (activeDelegates[(currentSlot + i) % slots.delegates]);
				}
			}

			return setImmediate(cb, null, {currentBlock: currentBlock.height, currentBlockSlot: currentBlockSlot, currentSlot: currentSlot, delegates: nextForgers});
		});
	},

	search: function (req, cb) {
		library.schema.validate(req.body, schema.search, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			let orderBy = OrderBy(
				req.body.orderBy, {
					sortFields: sql.sortFields,
					sortField: 'username'
				}
			);

			if (orderBy.error) {
				return setImmediate(cb, orderBy.error);
			}

			library.db.query(sql.search({
				q: req.body.q,
				limit: req.body.limit || 101,
				sortField: orderBy.sortField,
				sortMethod: orderBy.sortMethod
			})).then(function (rows) {
				return setImmediate(cb, null, {delegates: rows});
			}).catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(cb, 'Database search failed');
			});
		});
	},

	count: function (req, cb) {
		library.db.one(sql.count).then(function (row) {
			return setImmediate(cb, null, { count: row.count });
		}).catch(function (err) {
			library.logger.error(err.stack);
			return setImmediate(cb, 'Failed to count delegates');
		});
	},

	getVoters: function (req, cb) {
		library.schema.validate(req.body, schema.getVoters, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			library.db.one(sql.getVoters, { publicKey: req.body.publicKey }).then(function (row) {
				let addresses = (row.accountIds) ? row.accountIds : [];

				modules.accounts.getAccounts({
					address: { $in: addresses },
					sort: 'balance'
				}, ['address', 'balance', 'username', 'publicKey'], function (err, rows) {
					if (err) {
						return setImmediate(cb, err);
					} else {
						return setImmediate(cb, null, {accounts: rows});
					}
				});
			}).catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(cb, 'Failed to get voters for delegate: ' + req.body.publicKey);
			});
		});
	},

	getDelegates: function (req, cb) {
		library.schema.validate(req.body, schema.getDelegates, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			modules.delegates.getDelegates(req.body, function (err, data) {
				if (err) {
					return setImmediate(cb, err);
				}

				function compareNumber(a, b) {
					let sorta = parseFloat(a[data.sortField]);
					let sortb = parseFloat(b[data.sortField]);
					if (data.sortMethod === 'ASC') {
						return sorta - sortb;
					} else {
						return sortb - sorta;
					}
				}

				function compareString(a, b) {
					let sorta = a[data.sortField];
					let sortb = b[data.sortField];
					if (data.sortMethod === 'ASC') {
						return sorta.localeCompare(sortb);
					} else {
						return sortb.localeCompare(sorta);
					}
				}

				if (data.sortField) {
					// TODO: 'rate' property is deprecated and need to be removed after transitional period
					if (['approval', 'productivity', 'rate', 'rank', 'vote'].indexOf(data.sortField) > -1) {
						data.delegates = data.delegates.sort(compareNumber);
					} else if (['username', 'address', 'publicKey'].indexOf(data.sortField) > -1) {
						data.delegates = data.delegates.sort(compareString);
					} else {
						return setImmediate(cb, 'Invalid sort field');
					}
				}

				let delegates = data.delegates.slice(data.offset, data.limit);

				return setImmediate(cb, null, { delegates: delegates, totalCount: data.count });
			});
		});
	},

	getFee: function (req, cb) {
		return setImmediate(cb, null, {fee: constants.fees.delegate});
	},

	getForgedByAccount: function (req, cb) {
		library.schema.validate(req.body, schema.getForgedByAccount, function (err) {
			if (err) {
				return setImmediate(cb, err[0].message);
			}

			if (req.body.start !== undefined || req.body.end !== undefined) {
				modules.blocks.utils.aggregateBlocksReward({generatorPublicKey: req.body.generatorPublicKey, start: req.body.start, end: req.body.end}, function (err, reward) {
					if (err) {
						return setImmediate(cb, err);
					}

					let forged = new bignum(reward.fees).plus(new bignum(reward.rewards)).toString();
					return setImmediate(cb, null, {fees: reward.fees, rewards: reward.rewards, forged: forged, count: reward.count});
				});
			} else {
				modules.accounts.getAccount({publicKey: req.body.generatorPublicKey}, ['fees', 'rewards'], function (err, account) {
					if (err || !account) {
						return setImmediate(cb, err || 'Account not found');
					}

					let forged = new bignum(account.fees).plus(new bignum(account.rewards)).toString();
					return setImmediate(cb, null, {fees: account.fees, rewards: account.rewards, forged: forged});
				});
			}
		});
	},

	addDelegate: function (req, cb) {
		library.schema.validate(req.body, schema.addDelegate, function (err) {
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

			library.balancesSequence.add(function (cb) {
				if (req.body.multisigAccountPublicKey && req.body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
					modules.accounts.getAccount({publicKey: req.body.multisigAccountPublicKey}, function (err, account) {
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

						modules.accounts.getAccount({publicKey: keypair.publicKey}, function (err, requester) {
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

							let secondKeypair = null;

							if (requester.secondSignature) {
								let secondHash = crypto.createHash('sha256').update(req.body.secondSecret, 'utf8').digest();
								secondKeypair = library.ed.makeKeypair(secondHash);
							}

							let transaction;

							library.logic.transaction.create({
								type: transactionTypes.DELEGATE,
								username: req.body.username,
								URL: req.body.URL,
								sender: account,
								keypair: keypair,
								secondKeypair: secondKeypair,
								requester: keypair
							}).then((transactionDelegate) =>{
								transaction = transactionDelegate;
								modules.transactions.receiveTransactions([transaction], true, cb);
							}).catch((e) => {
								return setImmediate(cb, e.toString());
							});
						});
					});
				} else {
					modules.accounts.setAccountAndGet({publicKey: keypair.publicKey.toString('hex')}, function (err, account) {
						if (err) {
							return setImmediate(cb, err);
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

						let transaction;

						library.logic.transaction.create({
							type: transactionTypes.DELEGATE,
							username: req.body.username,
							URL: req.body.URL,
							sender: account,
							keypair: keypair,
							secondKeypair: secondKeypair
						}).then((transactionDelegate) =>{
							transaction = transactionDelegate;
							modules.transactions.receiveTransactions([transaction], true, cb);
						}).catch((e) => {
							return setImmediate(cb, e.toString());
						});
					});
				}
			}, function (err, transaction) {
				if (err) {
					return setImmediate(cb, err);
				} else {
					return setImmediate(cb, null, {transaction: transaction[0]});
				}
			});
		});
	}
};

// Export
module.exports = Delegates;

/*************************************** END OF FILE *************************************/
