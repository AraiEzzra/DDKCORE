const async = require('async');
const constants = require('../helpers/constants.js');
const exceptions = require('../helpers/exceptions.js');
const Diff = require('../helpers/diff.js');
const _ = require('lodash');
const sql = require('../sql/accounts.js');
const DelegateSQL = require('../sql/delegates');
const slots = require('../helpers/slots.js');
const { LENGTH, writeUInt64LE } = require('../helpers/buffer.js');
const utils = require('../utils');

const VVE = constants.VOTE_VALIDATION_ENABLED;

// Private fields
let modules;
let library;
let self;
const __private = {};

__private.loaded = false;

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
function Vote(logger, schema, db, frozen, account, cb) {
    self = this;
    library = {
        db,
        logger,
        schema,
        frozen,
        account
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
        delegates,
        rounds,
        accounts,
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
    let isDownVote;
    if (data.votes && data.votes[0]) {
        isDownVote = data.votes[0][0] === '-';
    }
    const totals = await library.frozen.calculateTotalRewardAndUnstake(senderId, isDownVote, trs.timestamp);
    const airdropReward = await library.frozen.getAirdropReward(senderId, totals.reward, data.type);

    trs.asset.votes = data.votes;
    trs.asset.reward = totals.reward || 0;
    trs.asset.unstake = totals.unstake || 0;
    trs.asset.airdropReward = {
        withAirdropReward: airdropReward.allowed,
        sponsors: airdropReward.sponsors,
        totalReward: airdropReward.total
    };
    trs.recipientId = data.sender.address;
    trs.trsName = isDownVote ? 'DOWNVOTE' : 'VOTE';
    return trs;
};

/**
 * Calculates vote fee by unconfirmed total froze amount.
 * @see {@link module:helpers/constants}
 * @return {number} fee
 */
Vote.prototype.calculateUnconfirmedFee = function (trs, sender) {
    return parseInt((parseInt(sender.u_totalFrozeAmount, 10) * constants.fees.vote) / 100, 10);
};

/**
 * Calculates vote fee.
 * @see {@link module:helpers/constants}
 * @return {number} fee
 */
Vote.prototype.calculateFee = function (trs, sender) {
    return parseInt((parseInt(sender.totalFrozeAmount, 10) * constants.fees.vote) / 100, 10);
};

Vote.prototype.onBlockchainReady = function () {
    __private.loaded = true;
};

/**
 * Validates vote transaction fields.
 * @implements {verifysendStakingRewardVote}
 * @implements {checkConfirmedDelegates}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback|function} returns error if invalid field |
 * calls callback.
 */
Vote.prototype.verifyFields = function (trs, sender, cb) {
    if (trs.recipientId !== trs.senderId) {
        if (VVE.INVALID_RECIPIENT === true) {
            return setImmediate(cb, 'Invalid recipient');
        }
        library.logger.error(`Invalid recipient!\n${{
            id: trs.id,
            type: trs.type,
            // trsName: trs.trsName,
            senderId: trs.senderId,
            recipientId: trs.recipientId,
        }}`);
    }

    if (!trs.asset || !trs.asset.votes) {
        if (VVE.INVALID_TRANSACTION_ASSET) {
            return setImmediate(cb, 'Invalid transaction asset');
        }
        library.logger.error(`Invalid transaction asset!\n${{
            id: trs.id,
            type: trs.type,
            asset: trs.asset,
        }}`);
    }

    if (!Array.isArray(trs.asset.votes)) {
        if (VVE.INVALID_VOTES_MUST_BE_ARRAY) {
            return setImmediate(cb, 'Invalid votes. Must be an array');
        }
        library.logger.error(`Invalid votes. Must be an array!\n${{
            id: trs.id,
            type: trs.type,
            votes: trs.asset.votes,
        }}`);
    }

    if (!trs.asset.votes.length) {
        if (VVE.INVALID_VOTES_EMPTY_ARRAY) {
            return setImmediate(cb, 'Invalid votes. Must not be empty');
        }
        library.logger.error(`Invalid votes. Must not be empty!\n${{
            id: trs.id,
            type: trs.type,
            votes: trs.asset.votes,
        }}`);
    }

    if (trs.asset.votes && trs.asset.votes.length > constants.maxVotesPerTransaction) {
        const msg = [
            'Voting limit exceeded. Maximum is',
            constants.maxVotesPerTransaction,
            'votes per transaction'
        ].join(' ');
        if (VVE.VOTING_LIMIT_EXCEEDED) {
            return setImmediate(cb, msg);
        }
        library.logger.error(`${msg}\n${{
            id: trs.id,
            type: trs.type,
            votes: {
                length: trs.asset.votes.length,
                maxLength: constants.maxVotesPerTransaction,
            }
        }}`);
    }

    (new Promise((resolve, reject) => {
        async.eachSeries(trs.asset.votes, (vote, eachSeriesCb) => {
            try {
                self.verifyVote(vote);
                return setImmediate(eachSeriesCb);
            } catch (err) {
                const msg = ['Invalid vote at index', trs.asset.votes.indexOf(vote), '-', err].join(' ');
                if (VVE.INVALID_VOTE_AT_INDEX) {
                    return setImmediate(eachSeriesCb, msg);
                }
                library.logger.error(`${msg}\n${{
                    id: trs.id,
                    type: trs.type,
                    vote: {
                        index: trs.asset.votes.indexOf(vote),
                        vote,
                    },
                    err,
                }}`);
            }
        }, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    }))
        .then(() => {
            if (trs.asset.votes.length > _.uniqBy(trs.asset.votes, v => v.slice(1)).length) {
                const msg = 'Multiple votes for same delegate are not allowed';
                if (VVE.MULTIPLE_VOTES_FOR_SAME_DELEGATE) {
                    throw msg;
                } else {
                    library.logger.error(`${msg}!\n${{
                        id: trs.id,
                        type: trs.type,
                        votes: trs.asset.votes
                    }}`);
                }
            }

            setImmediate(cb);
        })
        .catch(err => setImmediate(cb, err));
};

Vote.prototype.newVerifyFields = (trs) => {
    if (trs.recipientId !== trs.senderId) {
        throw new Error('Invalid recipient');
    }

    if (!trs.asset || !trs.asset.votes) {
        throw new Error('Invalid transaction asset');
    }

    if (!Array.isArray(trs.asset.votes)) {
        throw new Error('Invalid votes. Must be an array');
    }

    if (!trs.asset.votes.length) {
        throw new Error('Invalid votes. Must not be empty');
    }

    if (trs.asset.votes && trs.asset.votes.length > constants.maxVotesPerTransaction) {
        throw new Error([
            'Voting limit exceeded. Maximum is',
            constants.maxVotesPerTransaction,
            'votes per transaction'
        ].join(' '));
    }

    trs.asset.votes.forEach((vote) => {
        try {
            self.verifyVote(vote);
        } catch (e) {
            throw new Error(['Invalid vote at index', trs.asset.votes.indexOf(vote), '-', e].join(' '));
        }
    });

    if (trs.asset.votes.length > _.uniqBy(trs.asset.votes, v => v.slice(1)).length) {
        throw new Error('Multiple votes for same delegate are not allowed');
    }
};

Vote.prototype.newVerify = async (trs) => {
    try {
        self.newVerifyFields(trs);
    } catch (e) {
        throw e;
    }

    const isDownVote = trs.trsName === 'DOWNVOTE';
    const totals = await library.frozen.calculateTotalRewardAndUnstake(trs.senderId, isDownVote, trs.timestamp);

    if (totals.reward !== trs.asset.reward) {
        throw new Error(
            `Verify failed: vote reward is corrupted, expected: ${totals.reward} actual: ${trs.asset.reward}`
        );
    }

    if (totals.unstake !== trs.asset.unstake) {
        throw new Error(
            `Verify failed: vote unstake is corrupted, expected: ${totals.unstake} actual: ${trs.asset.unstake}`
        );
    }

    try {
        await library.frozen.verifyAirdrop(trs);
    } catch (e) {
        throw e;
    }
};

Vote.prototype.newVerifyUnconfirmed = async trs =>
    ((new Promise((resolve, reject) => {
        self.checkUnconfirmedDelegates(trs, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    })));

/**
 * Checks type, format and lenght from vote.
 * @param {Object} vote
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} error message | cb.
 */
Vote.prototype.verifyVote = (vote) => {
    if (typeof vote !== 'string') {
        throw new Error('Invalid vote type');
    }

    if (!/[-+]{1}[0-9a-z]{64}/.test(vote)) {
        throw new Error('Invalid vote format');
    }

    if (vote.length !== 65) {
        throw new Error('Invalid vote length');
    }
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
    modules.delegates.checkConfirmedDelegates(trs.senderPublicKey, trs.asset.votes, (err) => {
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
    modules.delegates.checkUnconfirmedDelegates(trs.senderPublicKey, trs.asset.votes, (err) => {
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
    let offset = 0;
    const buff = Buffer.alloc(
        LENGTH.INT64 + // reward
        LENGTH.INT64   // unstake
    );

    offset = writeUInt64LE(buff, trs.asset.reward, offset);
    offset = writeUInt64LE(buff, trs.asset.unstake ? (trs.asset.unstake * -1) : 0, offset);

    // airdropReward.sponsors up to 15 sponsors
    const sponsorsBuffer = Buffer.alloc((LENGTH.INT64 + LENGTH.INT64) * 15);

    offset = 0;

    Object.keys(trs.asset.airdropReward.sponsors).sort().forEach((address) => {
        offset = writeUInt64LE(sponsorsBuffer, parseInt(address.slice(3), 10), offset);
        offset = writeUInt64LE(sponsorsBuffer, trs.asset.airdropReward.sponsors[address] || 0, offset);
    });

    const voteBuffer = trs.asset.votes ? Buffer.from(trs.asset.votes.join(''), 'utf8') : Buffer.from([]);
    return Buffer.concat([buff, sponsorsBuffer, voteBuffer]);
};

Vote.prototype.apply = async (trs) => {
    const isDownVote = trs.trsName === 'DOWNVOTE';
    const votes = trs.asset.votes.map(vote => vote.substring(1));

    if (isDownVote) {
        await library.db.none(DelegateSQL.removeVoteForDelegates, {
            accountId: trs.senderId,
            dependentIds: votes,
        });
    } else {
        await library.db.none(DelegateSQL.addVoteForDelegates(votes), {
            accountId: trs.senderId,
        });
    }

    await library.db.query(sql.changeDelegateVoteCount({ value: isDownVote ? -1 : 1, votes }));
    if (!isDownVote) {
        const activeOrders = await library.db.manyOrNone(sql.updateStakeOrder, {
            senderId: trs.senderId,
            nextVoteMilestone: trs.timestamp + constants.froze.vTime * 60,
            currentTime: trs.timestamp
        });

        library.logger.debug(`[Vote][apply][activeOrders] ${JSON.stringify(activeOrders)}`);
        if (activeOrders && activeOrders.length > 0) {
            await library.frozen.applyFrozeOrdersRewardAndUnstake(trs, activeOrders);

            const bulk = utils.makeBulk(activeOrders, 'stake_orders');
            try {
                await utils.indexall(bulk, 'stake_orders');
            } catch (err) {
                library.logger.error(`elasticsearch error :${err.message}`);
            }
        }
    }
};

Vote.prototype.undo = async (trs) => {
    const isDownVote = trs.trsName === 'DOWNVOTE';

    const votes = trs.asset.votes.map(vote => vote.substring(1));
    if (isDownVote) {
        await library.db.none(DelegateSQL.addVoteForDelegates(votes), {
            accountId: trs.senderId,
        });
    } else {
        await library.db.none(DelegateSQL.removeVoteForDelegates, {
            accountId: trs.senderId,
            dependentIds: votes,
        });
    }

    await library.db.none(sql.changeDelegateVoteCount({ value: isDownVote ? 1 : -1, votes }));

    if (isDownVote) {
        return;
    }

    await library.frozen.undoFrozeOrdersRewardAndUnstake(trs);
    await library.db.none(sql.undoUpdateStakeOrder, {
        senderId: trs.senderId,
        milestone: constants.froze.vTime * 60,
        currentTime: trs.timestamp
    });
};

/**
 * Calls checkUnconfirmedDelegates based on transaction data and
 * merges account to sender address with votes as unconfirmed delegates.
 * @implements {checkUnconfirmedDelegates}
 * @implements {scope.account.merge}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function
 */
Vote.prototype.applyUnconfirmed = function (trs, sender, cb) {
    library.account.merge(sender.address, {
        u_delegates: trs.asset.votes
    }, err => setImmediate(cb, err));
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
    if (trs.asset.votes === null) {
        return setImmediate(cb);
    }

    const votesInvert = Diff.reverse(trs.asset.votes);

    this.scope.account.merge(sender.address, { u_delegates: votesInvert }, err => setImmediate(cb, err));
};

Vote.prototype.calcUndoUnconfirmed = async (trs, sender) => {
    if (trs.asset.votes) {
        sender.u_delegates = sender.u_delegates.filter(vote => !trs.asset.votes.includes(vote));
        sender.u_delegates.push(
            ...trs.asset.votes.filter(vote => vote[0] === '-').map(vote => vote.replace('-', '+')),
        );
    }

    return sender;
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
    const report = library.schema.validate(trs.asset, Vote.prototype.schema);

    if (!report) {
        throw `Failed to validate vote schema: ${this.scope.schema.getLastErrors().map(err => err.message).join(', ')}`;
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
    }
    const votes = raw.v_votes.split(',');
    const reward = Number(raw.v_reward) || 0;
    const unstake = Number(raw.v_unstake) || 0;
    const airdropReward = raw.v_airdropReward || {};

    return { votes, reward, unstake, airdropReward };
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
    }
    return true;
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
                senderId,
                nextVoteMilestone: voteTransaction.timestamp + constants.froze.vTime * 60,
                currentTime: voteTransaction.timestamp
            });

            if (activeOrders && activeOrders.length > 0) {
                await library.frozen.applyFrozeOrdersRewardAndUnstake(voteTransaction, activeOrders);

                const bulk = utils.makeBulk(activeOrders, 'stake_orders');
                try {
                    await utils.indexall(bulk, 'stake_orders');
                } catch (err) {
                    library.logger.error(`elasticsearch error :${err.message}`);
                }
            }
        });
    } catch (err) {
        library.logger.warn(err);
        throw err;
    }
};

// Export
module.exports = Vote;

/** ************************************* END OF FILE ************************************ */
