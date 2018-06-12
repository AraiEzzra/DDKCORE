

let async = require('async');
let constants = require('../helpers/constants.js');
let exceptions = require('../helpers/exceptions.js');
let Diff = require('../helpers/diff.js');
let _ = require('lodash');
let sql = require('../sql/accounts.js');

// Private fields
let modules, library, self;

// Constructor
/**
 * Initializes library.
 * @memberof module:accounts
 * @class
 * @classdesc Main vote logic.
 * Allows validate and undo transactions, verify votes.
 * @constructor
 * @param {Object} logger
 * @param {ZSchema} schema
 */
function Vote(logger, schema, db, cb) {
	self = this;
	library = {
		db: db,
		logger: logger,
		schema: schema,
	};
	if (cb) {
		return setImmediate(cb, null, this);
	}
}

// Public methods
/**
 * Binds module content to private object modules.
 * @param {Delegates} delegates
 * @param {Rounds} rounds
 */
Vote.prototype.bind = function (delegates, rounds, accounts) {
	modules = {
		delegates: delegates,
		rounds: rounds,
		accounts: accounts,
	};
};

/**
 * Sets recipientId with sender address.
 * Creates transaction.asset.votes based on data.
 * @param {Object} data
 * @param {transaction} trs
 * @return {transaction} trs with new data
 */
Vote.prototype.create = function (data, trs) {
	trs.recipientId = data.sender.address;
	trs.asset.votes = data.votes;

	return trs;
};

/**
 * Obtains constant fee vote.
 * @see {@link module:helpers/constants}
 * @return {number} fee
 */
Vote.prototype.calculateFee = function (trs, sender) {
	return (sender.totalFrozeAmount * constants.fees.vote) / 100;
};

/**
 * Validates transaction votes fields and for each vote calls verifyVote.
 * @implements {verifyVote}
 * @implements {checkConfirmedDelegates}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback|function} returns error if invalid field | 
 * calls checkConfirmedDelegates.
 */
Vote.prototype.verify = function (trs, sender, cb) {
	if (trs.recipientId !== trs.senderId) {
		return setImmediate(cb, 'Invalid recipient');
	}

	if (!trs.asset || !trs.asset.votes) {
		return setImmediate(cb, 'Invalid transaction asset');
	}

	if (!Array.isArray(trs.asset.votes)) {
		return setImmediate(cb, 'Invalid votes. Must be an array');
	}

	if (!trs.asset.votes.length) {
		return setImmediate(cb, 'Invalid votes. Must not be empty');
	}

	if (trs.asset.votes && trs.asset.votes.length > constants.maxVotesPerTransaction) {
		return setImmediate(cb, ['Voting limit exceeded. Maximum is', constants.maxVotesPerTransaction, 'votes per transaction'].join(' '));
	}

	async.eachSeries(trs.asset.votes, function (vote, eachSeriesCb) {
		self.verifyVote(vote, function (err) {
			if (err) {
				return setImmediate(eachSeriesCb, ['Invalid vote at index', trs.asset.votes.indexOf(vote), '-', err].join(' '));
			} else {
				return setImmediate(eachSeriesCb);
			}
		});
	}, function (err) {
		if (err) {
			return setImmediate(cb, err);
		} else {

			if (trs.asset.votes.length > _.uniqBy(trs.asset.votes, function (v) { return v.slice(1); }).length) {
				return setImmediate(cb, 'Multiple votes for same delegate are not allowed');
			}

			return self.checkConfirmedDelegates(trs, cb);
		}
	});
};

/**
 * Checks type, format and lenght from vote.
 * @param {Object} vote
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} error message | cb.
 */
Vote.prototype.verifyVote = function (vote, cb) {
	if (typeof vote !== 'string') {
		return setImmediate(cb, 'Invalid vote type');
	}

	if (!/[-+]{1}[0-9a-z]{64}/.test(vote)) {
		return setImmediate(cb, 'Invalid vote format');
	}

	if (vote.length !== 65) {
		return setImmediate(cb, 'Invalid vote length');
	}

	return setImmediate(cb);
};

/**
 * Calls checkConfirmedDelegates() with senderPublicKeykey and asset votes.
 * @implements {modules.delegates.checkConfirmedDelegates}
 * @param {transaction} trs
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} cb, err(if transaction id is not in 
 * exceptions votes list)
 */
Vote.prototype.checkConfirmedDelegates = function (trs, cb) {
	modules.delegates.checkConfirmedDelegates(trs.senderPublicKey, trs.asset.votes, function (err) {
		if (err && exceptions.votes.indexOf(trs.id) > -1) {
			library.logger.debug(err);
			library.logger.debug(JSON.stringify(trs));
			err = null;
		}

		return setImmediate(cb, err);
	});
};

/**
 * Calls checkUnconfirmedDelegates() with senderPublicKeykey and asset votes.
 * @implements {modules.delegates.checkUnconfirmedDelegates}
 * @param {Object} trs
 * @param {function} cb
 * @return {setImmediateCallback} cb, err(if transaction id is not in 
 * exceptions votes list)
 */
Vote.prototype.checkUnconfirmedDelegates = function (trs, cb) {
	modules.delegates.checkUnconfirmedDelegates(trs.senderPublicKey, trs.asset.votes, function (err) {
		if (err && exceptions.votes.indexOf(trs.id) > -1) {
			library.logger.debug(err);
			library.logger.debug(JSON.stringify(trs));
			err = null;
		}

		return setImmediate(cb, err);
	});
};

/**
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb
 * @return {setImmediateCallback} cb, null, trs
 */
Vote.prototype.process = function (trs, sender, cb) {
	return setImmediate(cb, null, trs);
};

/**
 * Creates a buffer with asset.votes information.
 * @param {transaction} trs
 * @return {Array} Buffer
 * @throws {e} error
 */
Vote.prototype.getBytes = function (trs) {
	let buf;

	try {
		buf = trs.asset.votes ? Buffer.from(trs.asset.votes.join(''), 'utf8') : null;
	} catch (e) {
		throw e;
	}

	return buf;
};

/**
 * Calls checkConfirmedDelegates based on transaction data and
 * merges account to sender address with votes as delegates.
 * @implements {checkConfirmedDelegates}
 * @implements {scope.account.merge}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @todo delete unnecessary let parent = this
 */
Vote.prototype.apply = function (trs, block, sender, cb) {
	let parent = this;

	async.series([
		function (seriesCb) {
			self.checkConfirmedDelegates(trs, seriesCb);
		},
		function (seriesCb) {
			parent.scope.account.merge(sender.address, {
				delegates: trs.asset.votes,
				blockId: block.id,
				round: modules.rounds.calc(block.height)
			}, seriesCb);
		},
		// call to updateAndCheckVote only for genesis block 
		function (seriesCb) {
			if (block.height !== 1) {
				return setImmediate(cb, null);
			}

			self.updateAndCheckVote(
				{
					votes: trs.asset.votes,
					senderId: trs.senderId
				}
				, function (err) {
					if (err) {
						return setImmediate(cb, err);
					}
					return setImmediate(cb, null);
				});
		}
	], cb);
};

/**
 * Calls Diff.reverse to change asset.votes signs and merges account to 
 * sender address with inverted votes as delegates.
 * @implements {Diff}
 * @implements {scope.account.merge}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {block} block
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} cb, err
 */
Vote.prototype.undo = function (trs, block, sender, cb) {
	if (trs.asset.votes === null) { return setImmediate(cb); }

	let votesInvert = Diff.reverse(trs.asset.votes);

	async.series([
		function (seriesCb) {
			this.scope.account.merge(sender.address, {
				delegates: votesInvert,
				blockId: block.id,
				round: modules.rounds.calc(block.height)
			}, seriesCb);
		}, 
		//added to remove vote count from mem_accounts table
		function (seriesCb) {
			self.updateAndCheckVote(
				{
					votes: votesInvert,
					senderId: trs.senderId
				}
				, function (err) {
					if (err) {
						return setImmediate(cb, err);
					}
					return setImmediate(cb, null);
				});
		}
	], cb);
};

/**
 * Calls checkUnconfirmedDelegates based on transaction data and
 * merges account to sender address with votes as unconfirmed delegates.
 * @implements {checkUnconfirmedDelegates}
 * @implements {scope.account.merge}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function
 * @todo delete unnecessary let parent = this
 */
Vote.prototype.applyUnconfirmed = function (trs, sender, cb) {
	let parent = this;

	async.series([
		function (seriesCb) {
			self.checkUnconfirmedDelegates(trs, seriesCb);
		},
		function (seriesCb) {
			parent.scope.account.merge(sender.address, {
				u_delegates: trs.asset.votes
			}, function (err) {
				return setImmediate(seriesCb, err);
			});
		}
	], cb);
};

/**
 * Calls Diff.reverse to change asset.votes signs and merges account to 
 * sender address with inverted votes as unconfirmed delegates.
 * @implements {Diff}
 * @implements {scope.account.merge}
 * @implements {modules.rounds.calc}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function
 * @return {setImmediateCallback} cb, err
 */
Vote.prototype.undoUnconfirmed = function (trs, sender, cb) {
	if (trs.asset.votes === null) { return setImmediate(cb); }

	let votesInvert = Diff.reverse(trs.asset.votes);

	this.scope.account.merge(sender.address, { u_delegates: votesInvert }, function (err) {
		return setImmediate(cb, err);
	});
};

/**
 * @typedef {Object} votes
 * @property {String[]} votes - Unique items, max constant activeDelegates.
 * @property {string} transactionId
 */
Vote.prototype.schema = {
	id: 'Vote',
	type: 'object',
	properties: {
		votes: {
			type: 'array',
			minItems: 1,
			maxItems: constants.maxVotesPerTransaction,
			uniqueItems: true
		}
	},
	required: ['votes']
};

/**
 * Validates asset schema.
 * @implements {library.schema.validate}
 * @param {transaction} trs
 * @return {transaction}
 * @throws {string} Failed to validate vote schema.
 * @todo should pass trs.asset.vote to validate?
 */
Vote.prototype.objectNormalize = function (trs) {
	let report = library.schema.validate(trs.asset, Vote.prototype.schema);

	if (!report) {
		throw 'Failed to validate vote schema: ' + this.scope.schema.getLastErrors().map(function (err) {
			return err.message;
		}).join(', ');
	}

	return trs;
};

/**
 * Creates votes object based on raw data.
 * @param {Object} raw
 * @return {null|votes} votes object
 */
Vote.prototype.dbRead = function (raw) {

	if (!raw.v_votes) {
		return null;
	} else {
		let votes = raw.v_votes.split(',');

		return { votes: votes };
	}
};

Vote.prototype.dbTable = 'votes';

Vote.prototype.dbFields = [
	'votes',
	'transactionId'
];

/**
 * Creates db operation object to 'votes' table based on votes data.
 * @param {transaction} trs
 * @return {Object[]} table, fields, values.
 */
Vote.prototype.dbSave = function (trs) {
	return {
		table: this.dbTable,
		fields: this.dbFields,
		values: {
			votes: Array.isArray(trs.asset.votes) ? trs.asset.votes.join(',') : null,
			transactionId: trs.id
		}
	};
};

/**
 * Checks sender multisignatures and transaction signatures.
 * @param {transaction} trs
 * @param {account} sender
 * @return {boolean} True if transaction signatures greather than 
 * sender multimin or there are not sender multisignatures.
 */
Vote.prototype.ready = function (trs, sender) {
	if (Array.isArray(sender.multisignatures) && sender.multisignatures.length) {
		if (!Array.isArray(trs.signatures)) {
			return false;
		}
		return trs.signatures.length >= sender.multimin;
	} else {
		return true;
	}
};

/**
 * Check and update vote milestone, vote count from stake_order and mem_accounts table
 * @param {voteInfo} voteInfo voteInfo have votes and senderId
 * @return {null|err} return null if success else err 
 * 
 */
Vote.prototype.updateAndCheckVote = function (voteInfo, cb) {
	let votes = voteInfo.votes;
	let senderId = voteInfo.senderId;

	function checkUpvoteDownvote(votes) {

		return new Promise(function (resolve, reject) {

			//To check that its upvote or downvote
			if ((votes[0])[0] === '+') {
				resolve(1);
			} else {
				resolve(0);
			}
		});
	}

	function checkWeeklyVote() {

		return new Promise(function (resolve, reject) {

			library.db.many(sql.checkWeeklyVote, {
				senderId: senderId
			})
				.then(function (resp) {
					if ((resp.length !== 0) && parseInt(resp[0].count) > 0) {
						resolve(true);
					} else {
						resolve(false);
					}
				})
				.catch(function (err) {
					library.logger.error(err.stack);
					reject(new Error(cb, err));
				});

		});
	}

	function updateStakeOrder() {

		return new Promise(function (resolve, reject) {

			library.db.none(sql.updateStakeOrder, {
				senderId: senderId
			})
				.then(function () {
					library.logger.info(senderId + ': update stake orders isvoteDone and count');
					resolve();
				})
				.catch(function (err) {
					library.logger.error(err.stack);
					//return setImmediate(cb, err);
					reject(new Error(cb, err));
				});
		});
	}

	function prepareQuery(voteType) {

		return new Promise(function (resolve, reject) {

			let inCondition = "";
			votes.forEach(function (vote) {
				let address = modules.accounts.generateAddressByPublicKey(vote.substring(1));
				inCondition += '\'' + address + '\' ,';
			});
			inCondition = inCondition.substring(0, inCondition.length - 1);
			let query;
			let sign = voteType === 1 ? '+' : '-';

			query = 'UPDATE mem_accounts SET "voteCount"="voteCount"' + sign + '1  WHERE "address" IN ( ' + inCondition + ')';

			resolve(query);

		});
	}

	function updateVoteCount(query) {

		return new Promise(function (resolve, reject) {

			library.db.query(query)
				.then(function () {
					resolve();
				})
				.catch(function (err) {
					library.logger.error(err.stack);
					//return setImmediate(cb, 'vote updation in mem_accounts table error');
					reject(new Error(cb, 'vote updation in mem_accounts table error'));
				});

		});
	}

	// Async/await function 
	(async function () {
		try {
			let voteType = await checkUpvoteDownvote(votes);

			if (voteType === 1) {
				let found = await checkWeeklyVote();
				if (found) {
					await updateStakeOrder();
				}
			}
			let query = await prepareQuery(voteType);
			await updateVoteCount(query);
			return setImmediate(cb, null);
		} catch (err) {
			self.scope.logger.error(err.stack);
			return setImmediate(cb, err.toString());
		}
	})();

};

// Export
module.exports = Vote;
