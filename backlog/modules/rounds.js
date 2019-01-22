const async = require('async');
const constants = require('../helpers/constants.js');
const Round = require('../logic/round.js');
const sandboxHelper = require('../helpers/sandbox.js');
const slots = require('../helpers/slots.js');
const sql = require('../sql/rounds.js');

// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};

__private.loaded = false;
__private.ticking = false;

/**
 * Initializes library with scope.
 * @memberof module:rounds
 * @class
 * @classdesc Main rounds methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 * @todo apply node pattern for callbacks: callback always at the end.
 */
// Constructor
function Rounds(cb, scope) {
    library = {
        logger: scope.logger,
        db: scope.db,
        bus: scope.bus,
        network: scope.network,
        config: {
            loading: {
                snapshot: scope.config.loading.snapshot,
            },
        }
    };
    self = this;

    setImmediate(cb, null, self);
}

// Public methods
/**
 * @return {boolean} __private.loaded
 */
Rounds.prototype.loaded = function () {
    return __private.loaded;
};

/**
 * @return {boolean} __private.ticking
 */
Rounds.prototype.ticking = function () {
    return __private.ticking;
};

/**
 * Returns average for each delegate based on height.
 * @param {number} height
 * @return {number} height / delegates
 */
Rounds.prototype.calc = function (height) {
    return Math.ceil(height / self.getSlotDelegatesCount(height));
};

Rounds.prototype.getSlotDelegatesCount = height =>
    height && height <= constants.MASTER_NODE_MIGRATED_BLOCK ? constants.PREVIOUS_DELEGATES_COUNT : slots.delegates;

/**
 * Deletes from `mem_round` table records based on round.
 * @implements {library.db.none}
 * @param {number} round
 * @param {function} cb
 * @return {setImmediateCallback} error message | cb
 *
 */
Rounds.prototype.flush = function (round, cb) {
    library.db.none(sql.flush, { round }).then(() => setImmediate(cb)).catch((err) => {
        library.logger.error(err.stack);
        return setImmediate(cb, 'Rounds#flush error');
    });
};

/**
 * Performs backward tick on round
 * @implements {calc}
 * @implements {__private.getOutsiders}
 * @implements {Round.mergeBlockGenerator}
 * @implements {Round.markBlockId}
 * @implements {Round.land}
 * @implements {library.db.tx}
 * @param {block} block
 * @param {block} previousBlock
 * @param {function} done - Callback function
 * @return {function} done with error if any
 */
Rounds.prototype.backwardTick = function (block, previousBlock, done) {
    const round = self.calc(block.height);
    const prevRound = self.calc(previousBlock.height);
    const nextRound = self.calc(block.height + 1);

    const scope = {
        library,
        modules,
        block,
        round,
        backwards: true
    };

    // Establish if finishing round or not
    scope.finishRound = (
        (prevRound === round && nextRound !== round) || (block.height === 1 || block.height === 101)
    );

    function BackwardTick(t) {
        const promised = new Round(scope, t);

        library.logger.debug('Performing backward tick');
        library.logger.trace(scope);

        return promised.mergeBlockGenerator().then(() => {
            if (scope.finishRound) {
                return promised.backwardLand().then(() => promised.markBlockId());
            }
            return promised.markBlockId();
        });
    }

    async.series([
        function (cb) {
            // Start round ticking
            __private.ticking = true;

            // Sum round if finishing round
            if (scope.finishRound) {
                return __private.sumRound(scope, cb);
            }
            return setImmediate(cb);
        },
        function (cb) {
            // Get outsiders if finishing round
            if (scope.finishRound) {
                return __private.getOutsiders(scope, cb);
            }
            return setImmediate(cb);
        },
        function (cb) {
            // Perform round tick
            library.db.tx(BackwardTick).then(() => setImmediate(cb)).catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, err);
            });
        }
    ], (err) => {
        // Stop round ticking
        __private.ticking = false;
        return done(err);
    });
};

/**
 * Sets snapshot rounds
 * @param {number} rounds
 */
Rounds.prototype.setSnapshotRounds = function (rounds) {
    library.config.loading.snapshot = rounds;
};

/**
 * Generates snapshot round
 * @implements {calc}
 * @implements {Round.mergeBlockGenerator}
 * @implements {Round.land}
 * @implements {library.bus.message}
 * @implements {Round.truncateBlocks}
 * @implements {__private.getOutsiders}
 * @param {block} block
 * @param {function} done
 * @return {function} done message | err
 */
Rounds.prototype.tick = function (block, done) {
    const round = self.calc(block.height);
    const nextRound = self.calc(block.height + 1);

    const scope = {
        library,
        modules,
        block,
        round,
        backwards: false
    };

    // Establish if snapshotting round or not
    scope.snapshotRound = (
        library.config.loading.snapshot > 0 && library.config.loading.snapshot === round
    );

    // Establish if finishing round or not
    scope.finishRound = (
        (round !== nextRound) || (block.height === 1 || block.height === 101)
    );

    function Tick(t) {
        const promised = new Round(scope, t);

        library.logger.debug('Performing forward tick');
        library.logger.trace(scope);

        return promised.mergeBlockGenerator().then(() => {
            if (scope.finishRound) {
                return promised.land().then(() => {
                    library.bus.message('finishRound', round);
                    if (scope.snapshotRound) {
                        return promised.truncateBlocks().then(() => {
                            scope.finishSnapshot = true;
                        });
                    }
                });
            }
        });
    }

    async.series([
        function (cb) {
            // Start round ticking
            __private.ticking = true;

            // Sum round if finishing round
            if (scope.finishRound) {
                return __private.sumRound(scope, cb);
            }
            return setImmediate(cb);
        },
        function (cb) {
            // Get outsiders if finishing round
            if (scope.finishRound) {
                return __private.getOutsiders(scope, cb);
            }
            return setImmediate(cb);
        },
        // Perform round tick
        function (cb) {
            library.db.tx(Tick).then(() => setImmediate(cb)).catch((err) => {
                library.logger.error(err.stack);
                return setImmediate(cb, err);
            });
        },
        function (cb) {
            // Check if we are one block before last block of round, if yes - perform round snapshot
            if ((block.height + 1) % self.getSlotDelegatesCount(block.height + 1) === 0) {
                library.logger.debug('Performing round snapshot...');

                library.db.tx(t => t.batch([
                    t.none(sql.clearRoundSnapshot),
                    t.none(sql.performRoundSnapshot),
                    t.none(sql.clearVotesSnapshot),
                    t.none(sql.performVotesSnapshot)
                ])).then(() => {
                    library.logger.trace('Round snapshot done');
                    return setImmediate(cb);
                }).catch((err) => {
                    library.logger.error('Round snapshot failed', err);
                    return setImmediate(cb, err);
                });
            } else {
                return setImmediate(cb);
            }
        }
    ], (err) => {
        // Stop round ticking
        __private.ticking = false;

        if (scope.finishSnapshot) {
            return done('Snapshot finished');
        }
        return done(err);
    });
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {*} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Rounds.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Assigns modules to private variable `modules`.
 * @param {modules} scope - Loaded modules.
 */
Rounds.prototype.onBind = function (scope) {
    modules = {
        blocks: scope.blocks,
        accounts: scope.accounts,
        delegates: scope.delegates,
    };
};

/**
 * Sets private variable loaded to true.
 *
 * @public
 * @method  onBlockchainReady
 * @listens module:loader~event:blockchainReady
 * @param   {block}   block New block
 */
Rounds.prototype.onBlockchainReady = function () {
    __private.loaded = true;
};

/**
 * Emits a 'rounds/change' socket message.
 * @implements {library.network.io.sockets.emit}
 * @param {number} round
 * @emits rounds/change
 */
Rounds.prototype.onFinishRound = function (round) {
    library.network.io.sockets.emit('rounds/change', { number: round });
};

/**
 * Sets private variable `loaded` to false.
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Rounds.prototype.cleanup = function (cb) {
    __private.loaded = false;
    return setImmediate(cb);
};

// Private methods
/**
 * Generates outsiders array and pushes to param scope variable.
 * Obtains delegate list and for each delegate generate address.
 * @private
 * @implements {modules.delegates.generateDelegateList}
 * @implements {modules.accounts.generateAddressByPublicKey}
 * @param {scope} scope
 * @param {function} cb
 * @return {setImmediateCallback} cb if block height 1 | error
 */
__private.getOutsiders = function (scope, cb) {
    scope.roundOutsiders = [];

    if (scope.block.height === 1) {
        return setImmediate(cb);
    }
    modules.delegates.generateDelegateList(scope.block.height, null, (err, roundDelegates) => {
        if (err) {
            return setImmediate(cb, err);
        }
        async.eachSeries(roundDelegates, (delegate, eachCb) => {
            if (scope.roundDelegates && scope.roundDelegates.indexOf(delegate) === -1) {
                scope.roundOutsiders.push(modules.accounts.generateAddressByPublicKey(delegate));
            }
            return setImmediate(eachCb);
        }, (err) => {
            library.logger.trace('Got outsiders', scope.roundOutsiders);
            return setImmediate(cb, err);
        });
    });
};

/**
 * Gets rows from `round_blocks` and calculates rewards. Loads into scope
 * variable fees, rewards and delegates.
 * @private
 * @implements {library.db.query}
 * @param {number} round
 * @param {function} cb
 * @return {setImmediateCallback} err When failed to sum round | cb
 */
__private.sumRound = function (scope, cb) {
    library.logger.debug('Summing round', scope.round);

    library.db.query(sql.summedRound, {
        round: scope.round,
        activeDelegates: constants.activeDelegates
    }).then((rows) => {
        const rewards = [];

        if (rows[0].rewards) {
            rows[0].rewards.forEach((reward) => {
                rewards.push(Math.floor(reward));
            });
        }

        scope.roundFees = Math.floor(rows[0].fees);
        scope.roundRewards = rewards;
        scope.roundDelegates = rows[0].delegates;

        library.logger.trace('roundFees', scope.roundFees);
        library.logger.trace('roundRewards', scope.roundRewards);
        library.logger.trace('roundDelegates', scope.roundDelegates);

        return setImmediate(cb);
    }).catch((err) => {
        library.logger.error('Failed to sum round', scope.round);
        library.logger.error(err.stack);
        return setImmediate(cb, err);
    });

    const used = process.memoryUsage();
    for (const key in used) {
        library.logger.info('Application Memory Allocation : ' + `${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
};

// Export
module.exports = Rounds;


/** ************************************* END OF FILE ************************************ */
