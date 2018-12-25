let async = require('async');
let constants = require('../helpers/constants.js');
let exceptions = require('../helpers/exceptions.js');
let Diff = require('../helpers/diff.js');
let _ = require('lodash');
let sql = require('../sql/accounts.js');
let slots = require('../helpers/slots.js');
const transactionTypes = require('../helpers/transactionTypes');
let utils = require('../utils');

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
 * @param {Object} db
 * @param {Object} frozen
 * @param {Function} cb
 */
function Vote(logger, schema, db, frozen, cb) {
	self = this;
	library = {
		db: db,
		logger: logger,
		schema: schema,
        frozen: frozen
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
Vote.prototype.create = async function (data, trs) {
    const senderId = data.sender.address;
    const isDownVote = data.votes[0][0] == "-";
    const totals = await library.frozen.calculateTotalRewardAndUnstake(senderId, isDownVote);
    const airdropReward = await library.frozen.getAirdropReward(senderId, totals.reward, data.type);

	trs.asset.votes = data.votes;
	trs.asset.reward = totals.reward || 0;
	trs.asset.unstake = totals.unstake || 0;
    trs.asset.airdropReward = {
        withAirdropReward : airdropReward.allowed,
        sponsors: airdropReward.sponsors,
		totalReward: airdropReward.total
    };
    trs.recipientId = data.sender.address;
    trs.trsName = isDownVote ? "DOWNVOTE" : "VOTE";
	return trs;

};

/**
 * Obtains constant fee vote.
 * @see {@link module:helpers/constants}
 * @return {number} fee
 */
Vote.prototype.calculateFee = function (trs, sender) {
	return parseInt((parseInt(sender.totalFrozeAmount) * constants.fees.vote) / 100);
};

/**
 * Validates transaction votes fields and for each vote calls verifyVote.
 * @implements {verifysendStakingRewardVote}
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

	(new Promise((resolve, reject) => {
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
                reject(err);
            }
            resolve();
        });
	})).then( async () => {

		if (trs.asset.votes.length > _.uniqBy(trs.asset.votes, function (v) { return v.slice(1); }).length) {
			throw 'Multiple votes for same delegate are not allowed';
		}
        const isDownVote = trs.trsName === "DOWNVOTE";
        const totals = await library.frozen.calculateTotalRewardAndUnstake(trs.senderId, isDownVote);
        if (totals.reward !== trs.asset.reward) {
            throw 'Verify failed: vote reward is corrupted';
        }
        if (totals.unstake !== trs.asset.unstake) {
            throw 'Verify failed: vote unstake is corrupted';
        }

        await library.frozen.verifyAirdrop(trs);
        return self.checkConfirmedDelegates(trs, cb);
	}).catch((err) => {
        return setImmediate(cb, err);
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
	// return null;
	// FIXME add new logic for bytes
	// https://trello.com/c/Lt24bdzI/143-add-new-logic-for-bytes
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
		function (seriesCb) {
			self.updateMemAccounts({ votes: trs.asset.votes, senderId: trs.senderId },
			function (err) {
				if (err) {
					return setImmediate(seriesCb, err);
				}
				return setImmediate(seriesCb, null, trs);
			});
		},
		function (seriesCb) {
            const isDownVote = trs.trsName === "DOWNVOTE";
            if(isDownVote) {
                return setImmediate(seriesCb, null, trs);
			}
			self.updateAndCheckVote(trs)
			.then(
				() => setImmediate(seriesCb, null, trs),
				err => setImmediate(seriesCb, err),
			);
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
	let parent = this;
	if (trs.asset.votes === null) { return setImmediate(cb); }

	let votesInvert = Diff.reverse(trs.asset.votes);

	async.series([
		function (seriesCb) {
			parent.scope.account.merge(sender.address, {
				delegates: votesInvert,
				blockId: block.id,
				round: modules.rounds.calc(block.height)
			}, seriesCb);
		},
		//added to remove vote count from mem_accounts table
		function (seriesCb) {
			self.updateMemAccounts(
				{
					votes: votesInvert,
					senderId: trs.senderId
				}
                , function (err) {
                    if (err) {
                        return setImmediate(seriesCb, err);
                    }
                    return setImmediate(seriesCb, null);
                });
		},
        function (seriesCb) {
            const isDownVote = trs.trsName === "DOWNVOTE";
            if(isDownVote) {
                return setImmediate(seriesCb, null, trs);
            }
            self.removeCheckVote(trs)
                .then(
                    () => setImmediate(seriesCb, null),
                    err => setImmediate(seriesCb, err),
                );
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
		const votes = raw.v_votes.split(',');
        const reward = Number(raw.v_reward) || 0;
		const unstake = Number(raw.v_unstake) || 0;
        const airdropReward = raw.v_airdropReward || {};

		return { votes: votes, reward: reward, unstake: unstake, airdropReward: airdropReward };
	}
};

Vote.prototype.dbTable = 'votes';

Vote.prototype.dbFields = [
	'votes',
	'transactionId',
    'reward',
    'unstake',
    'airdropReward'
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
			transactionId: trs.id,
			reward: trs.asset.reward || 0,
            unstake: trs.asset.unstake || 0,
            airdropReward: trs.asset.airdropReward || {}
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
 * @param {Object} voteTransaction transaction data object
 * @return {null|err} return null if success else err
 *
 */
Vote.prototype.updateAndCheckVote = async (voteTransaction) => {
	const senderId = voteTransaction.senderId;
	try {
		// todo check if could change to tx
		await library.db.task(async () => {
			const activeOrders = await library.db.manyOrNone(sql.updateStakeOrder, {
				senderId: senderId,
				milestone: constants.froze.vTime * 60, // 2 * 60 sec = 2 mins
				currentTime: slots.getTime()
			});

			if (activeOrders && activeOrders.length > 0) {
				await library.frozen.applyFrozeOrdersRewardAndUnstake(voteTransaction, activeOrders);

				let bulk = utils.makeBulk(activeOrders, 'stake_orders');
				try {
					await utils.indexall(bulk, 'stake_orders');
					library.logger.info(senderId + ': update stake orders isvoteDone and count');
				} catch (err) {
					library.logger.error('elasticsearch error :' + err.message);
				}

			}
		});
	} catch (err) {
		library.logger.warn(err);
		throw err;
	}
};

/**
 * Check and update vote milestone, vote count from stake_order and mem_accounts table
 * @param {Object} voteTransaction transaction data object
 * @return {null|err} return null if success else err
 *
 */
Vote.prototype.removeCheckVote = async (voteTransaction) => {
    const senderId = voteTransaction.senderId;
    try {
        // todo check if could change to tx
        await library.db.task(async () => {
            await library.frozen.undoFrozeOrdersRewardAndUnstake(voteTransaction);
			await library.db.none(sql.undoUpdateStakeOrder, {
				senderId: senderId,
				milestone: constants.froze.vTime * 60,
				currentTime: slots.getTime()
			});
        });
    } catch (err) {
        library.logger.warn(err);
        throw err;
    }
};

/**
 * Update vote count from stake_order and mem_accounts table
 * @param {voteInfo} voteInfo voteInfo have votes and senderId
 * @return {null|err} return null if success else err
 *
 */
Vote.prototype.updateMemAccounts = function (voteInfo, cb) {
	let votes = voteInfo.votes;
	let senderId = voteInfo.senderId;

	function checkUpvoteDownvote(waterCb) {

		if ((votes[0])[0] === '+') {
			return setImmediate(waterCb, null, 1);
		} else {
			return setImmediate(waterCb, null, 0);
		}
	}

	function prepareQuery(voteType, waterCb) {

		let inCondition = "";
		votes.forEach(function (vote) {
			let address = modules.accounts.generateAddressByPublicKey(vote.substring(1));
			inCondition += '\'' + address + '\' ,';
		});
		inCondition = inCondition.substring(0, inCondition.length - 1);
		let query;
		let sign = voteType === 1 ? '+' : '-';

		query = 'UPDATE mem_accounts SET "voteCount"="voteCount"' + sign + '1  WHERE "address" IN ( ' + inCondition + ')';

		return setImmediate(waterCb, null, query);

	}

	function updateVoteCount(query, waterCb) {

		library.db.query(query)
			.then(function () {
				return setImmediate(waterCb);
			})
			.catch(function (err) {
				library.logger.error(err.stack);
				return setImmediate(waterCb, 'vote updation in mem_accounts table error');
			});
	}

	async.waterfall([
		checkUpvoteDownvote,
		prepareQuery,
		updateVoteCount
	], function (err) {
		if (err) {
			library.logger.warn(err);
			return setImmediate(cb, err);
		}
		return setImmediate(cb, null);
	});

};

// Export
module.exports = Vote;

/*************************************** END OF FILE *************************************/
