const async = require('async');
const constants = require('../helpers/constants.js');
const exceptions = require('../helpers/exceptions.js');
const Diff = require('../helpers/diff.js');
const _ = require('lodash');
const sql = require('../sql/accounts.js');
const slots = require('../helpers/slots.js');
const transactionTypes = require('../helpers/transactionTypes');
const { LENGTH, writeUInt64LE } = require('../helpers/buffer.js');
const utils = require('../utils');

// Private fields
let modules,
    library,
    self,
    __private = {};

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
function Vote(logger, schema, db, frozen, cb) {
    self = this;
    library = {
        db,
        logger,
        schema,
        frozen
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
    const isDownVote = data.votes[0][0] == '-';
    const totals = await library.frozen.calculateTotalRewardAndUnstake(senderId, isDownVote);
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
    return parseInt((parseInt(sender.u_totalFrozeAmount) * constants.fees.vote) / 100);
};

/**
 * Calculates vote fee.
 * @see {@link module:helpers/constants}
 * @return {number} fee
 */
Vote.prototype.calculateFee = function (trs, sender) {
    return parseInt((parseInt(sender.totalFrozeAmount) * constants.fees.vote) / 100);
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
    const VVE = constants.VOTE_VALIDATION_ENABLED;

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
        const msg = ['Voting limit exceeded. Maximum is', constants.maxVotesPerTransaction, 'votes per transaction'].join(' ');
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
            self.verifyVote(vote, (err) => {
                if (err) {
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
                } else {
                    return setImmediate(eachSeriesCb);
                }
            });
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
    const VVE = constants.VOTE_VALIDATION_ENABLED;

    async.series([
        function (seriesCb) {
            self.verifyFields(trs, sender, seriesCb);
        },
        async function (seriesCb) {
            if (__private.loaded) {
                const isDownVote = trs.trsName === 'DOWNVOTE';
                const totals = await library.frozen.calculateTotalRewardAndUnstake(trs.senderId, isDownVote);
                if (totals.reward !== trs.asset.reward) {
                    const msg = 'Verify failed: vote reward is corrupted';
                    if (VVE.VOTE_REWARD_CORRUPTED) {
                        return setImmediate(seriesCb, msg);
                    } else {
                        library.logger.error(`${msg}!\n${{
                            id: trs.id,
                            type: trs.type,
                            reward: {
                                asset: trs.asset.reward,
                                totals: totals.reward,
                            }
                        }}`);
                    }
                }
                if (totals.unstake !== trs.asset.unstake) {
                    const msg = 'Verify failed: vote unstake is corrupted';
                    if (VVE.VOTE_UNSTAKE_CORRUPTED) {
                        return setImmediate(seriesCb, msg);
                    } else {
                        library.logger.error(`${msg}! ${{
                            id: trs.id,
                            type: trs.type,
                            unstake: {
                                asset: trs.asset.unstake,
                                totals: totals.unstake,
                            }
                        }}`);
                    }
                }
            }

            try {
                await library.frozen.verifyAirdrop(trs);
            } catch (error) {
                if (VVE.VOTE_AIRDROP_CORRUPTED) {
                    return setImmediate(seriesCb, error);
                } else {
                    library.logger.error(`trs.id ${trs.id}, ${error}`);
                }
            }

            return setImmediate(seriesCb);
        },
    ], cb);
};

/**
 * Validates unconfirmed vote transaction fields and for each calls verifyVote.
 * @implements {verifysendStakingRewardVote}
 * @implements {checkConfirmedDelegates}
 * @param {transaction} trs
 * @param {account} sender
 * @param {function} cb - Callback function.
 * @returns {setImmediateCallback|function} returns error if invalid field |
 * calls checkConfirmedDelegates.
 */
Vote.prototype.verifyUnconfirmed = function (trs, sender, cb) {
    return self.checkUnconfirmedDelegates(trs, cb);
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
    const parent = this;

    async.series([
        function (seriesCb) {
            parent.scope.account.merge(sender.address, {
                delegates: trs.asset.votes,
                blockId: block.id,
                round: modules.rounds.calc(block.height)
            }, seriesCb);
        },
        function (seriesCb) {
            self.updateMemAccounts({ votes: trs.asset.votes, senderId: trs.senderId },
                (err) => {
                    if (err) {
                        return setImmediate(seriesCb, err);
                    }
                    return setImmediate(seriesCb, null, trs);
                });
        },
        function (seriesCb) {
            let voteValue = 1;
            const isDownVote = trs.trsName === 'DOWNVOTE';
            const votes = trs.asset.votes.map(vote => vote.substring(1));
            if (isDownVote) {
                voteValue = -1;
            }
            library.db.query(sql.changeDelegateVoteCount({ value: voteValue, votes }))
                .then(() => setImmediate(seriesCb, null))
                .catch((err) => {
                    library.logger.error(err.stack);
                    return setImmediate(seriesCb, err);
                });
        },
        function (seriesCb) {
            const isDownVote = trs.trsName === 'DOWNVOTE';
            if (isDownVote) {
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
    const parent = this;
    if (trs.asset.votes === null) {
        return setImmediate(cb);
    }

    const votesInvert = Diff.reverse(trs.asset.votes);

    async.series([
        function (seriesCb) {
            parent.scope.account.merge(sender.address, {
                delegates: votesInvert,
                blockId: block.id,
                round: modules.rounds.calc(block.height)
            }, seriesCb);
        },
        // added to remove vote count from mem_accounts table
        function (seriesCb) {
            self.updateMemAccounts(
                {
                    votes: votesInvert,
                    senderId: trs.senderId
                }
                , (err) => {
                    if (err) {
                        return setImmediate(seriesCb, err);
                    }
                    return setImmediate(seriesCb, null);
                });
        },
        function (seriesCb) {
            const votes = trs.asset.votes.map(vote => vote.substring(1));

            library.db.query(sql.changeDelegateVoteCount({ value: -1, votes }))
                .then(() => setImmediate(seriesCb, null))
                .catch((err) => {
                    library.logger.error(err.stack);
                    return setImmediate(seriesCb, err);
                });
        },
        function (seriesCb) {
            const isDownVote = trs.trsName === 'DOWNVOTE';
            if (isDownVote) {
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
    const parent = this;

    parent.scope.account.merge(sender.address, {
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
                milestone: constants.froze.vTime * 60, // 2 * 60 sec = 2 mins
                currentTime: slots.getTime()
            });

            if (activeOrders && activeOrders.length > 0) {
                await library.frozen.applyFrozeOrdersRewardAndUnstake(voteTransaction, activeOrders);

                const bulk = utils.makeBulk(activeOrders, 'stake_orders');
                try {
                    await utils.indexall(bulk, 'stake_orders');
                    library.logger.info(`${senderId}: update stake orders isvoteDone and count`);
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
                senderId,
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
    const votes = voteInfo.votes;
    const senderId = voteInfo.senderId;

    function checkUpvoteDownvote(waterCb) {
        if ((votes[0])[0] === '+') {
            return setImmediate(waterCb, null, 1);
        }
        return setImmediate(waterCb, null, 0);
    }

    function prepareQuery(voteType, waterCb) {
        let inCondition = '';
        votes.forEach((vote) => {
            const address = modules.accounts.generateAddressByPublicKey(vote.substring(1));
            inCondition += `'${address}' ,`;
        });
        inCondition = inCondition.substring(0, inCondition.length - 1);
        let query;
        const sign = voteType === 1 ? '+' : '-';

        query = `UPDATE mem_accounts SET "voteCount"="voteCount"${sign}1  WHERE "address" IN ( ${inCondition})`;

        return setImmediate(waterCb, null, query);
    }

    function updateVoteCount(query, waterCb) {
        library.db.query(query)
            .then(() => setImmediate(waterCb))
            .catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(waterCb, 'vote updation in mem_accounts table error');
            });
    }

    async.waterfall([
        checkUpvoteDownvote,
        prepareQuery,
        updateVoteCount
    ], (err) => {
        if (err) {
            library.logger.warn(err);
            return setImmediate(cb, err);
        }
        return setImmediate(cb, null);
    });
};

// Export
module.exports = Vote;

/** ************************************* END OF FILE ************************************ */
