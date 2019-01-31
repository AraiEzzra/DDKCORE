const async = require('async');
const constants = require('../helpers/constants.js');
const jobsQueue = require('../helpers/jobsQueue.js');
const sandboxHelper = require('../helpers/sandbox.js');
const schema = require('../schema/loader.js');
const pgp = require('pg-promise');
const path = require('path');
const sql = require('../sql/loader.js');

require('colors');

// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};
let firstSync = true;

__private.loaded = false;
__private.isActive = false;
__private.lastBlock = null;
__private.genesisBlock = null;
__private.total = 0;
__private.blocksToSync = 0;
__private.syncIntervalId = null;
__private.syncInterval = 10000;
__private.retries = 5;

/**
 * Initializes library with scope content.
 * Calls private function initialize.
 * @memberof module:loader
 * @class
 * @classdesc Main Loader methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function Loader(cb, scope) {
    library = {
        logger: scope.logger,
        db: scope.db,
        network: scope.network,
        schema: scope.schema,
        sequence: scope.sequence,
        bus: scope.bus,
        genesisblock: scope.genesisblock,
        balancesSequence: scope.balancesSequence,
        logic: {
            transaction: scope.logic.transaction,
            account: scope.logic.account,
            peers: scope.logic.peers,
        },
        config: {
            loading: {
                verifyOnLoading: scope.config.loading.verifyOnLoading,
                snapshot: scope.config.loading.snapshot,
            },
        },
    };
    self = this;

    __private.initialize();
    __private.genesisBlock = __private.lastBlock = library.genesisblock;

    setImmediate(cb, null, self);
}

// Private methods
/**
 * Sets private network object with height 0 and peers empty array.
 * @private
 */
__private.initialize = function () {
    __private.network = {
        height: 0, // Network height
        peers: [] // "Good" peers and with height close to network height
    };
};

/**
 * Cancels timers based on input parameter and private variable syncIntervalId
 * or Sync trigger by sending a socket signal with 'loader/sync' and setting
 * next sync with 1000 milliseconds.
 * @private
 * @implements {library.network.io.sockets.emit}
 * @implements {modules.blocks.lastBlock.get}
 * @param {boolean} turnOn
 * @emits loader/sync
 */
__private.syncTrigger = function (turnOn) {
    if (turnOn === false && __private.syncIntervalId) {
        library.logger.trace('Clearing sync interval');
        clearTimeout(__private.syncIntervalId);
        __private.syncIntervalId = null;
    }
    if (turnOn === true && !__private.syncIntervalId) {
        library.logger.trace('Setting sync interval');
        setImmediate(function nextSyncTrigger() {
            library.logger.trace('Sync trigger');
            library.network.io.sockets.emit('loader/sync', {
                blocks: __private.blocksToSync,
                height: modules.blocks.lastBlock.get().height
            });
            __private.syncIntervalId = setTimeout(nextSyncTrigger, 1000);
        });
    }
};

/**
 * Syncs timer trigger.
 * @private
 * @implements {modules.blocks.lastReceipt.get}
 * @implements {modules.blocks.lastReceipt.isStale}
 * @implements {Loader.syncing}
 * @implements {library.sequence.add}
 * @implements {async.retry}
 * @implements {__private.initialize}
 */
__private.syncTimer = function () {
    library.logger.trace('Setting sync timer');

    function nextSync(cb) {
        library.logger.trace('Sync timer trigger', {
            loaded: __private.loaded,
            syncing: self.syncing(),
            last_receipt: modules.blocks.lastReceipt.get()
        });

        if (__private.loaded && !self.syncing() && modules.blocks.lastReceipt.isStale()) {
            library.sequence.add((sequenceCb) => {
                async.retry(__private.retries, __private.sync, sequenceCb);
            }, (err) => {
                if (err) {
                    library.logger.error('Sync timer', err);
                    __private.initialize();
                }
                return setImmediate(cb);
            });
        } else {
            return setImmediate(cb);
        }
    }

    jobsQueue.register('loaderSyncTimer', nextSync, __private.syncInterval);
};

/**
 * Gets a random peer and loads signatures calling the api.
 * Processes each signature from peer.
 * @private
 * @implements {Loader.getNetwork}
 * @implements {modules.transport.getFromPeer}
 * @implements {library.schema.validate}
 * @implements {library.sequence.add}
 * @implements {async.eachSeries}
 * @implements {modules.multisignatures.processSignature}
 * @param {function} cb
 * @return {setImmediateCallback} cb, err
 */
__private.loadSignatures = function (cb) {
    async.waterfall([
        function (waterCb) {
            self.getNetwork((err, network) => {
                if (err) {
                    return setImmediate(waterCb, err);
                }
                const peer = network.peers[Math.floor(Math.random() * network.peers.length)];
                return setImmediate(waterCb, null, peer);
            });
        },
        function (peer, waterCb) {
            library.logger.log(`Loading signatures from: ${peer.string}`);

            modules.transport.getFromPeer(peer, {
                api: '/signatures',
                method: 'GET'
            }, (err, res) => {
                if (err) {
                    return setImmediate(waterCb, err);
                }
                library.schema.validate(res.body, schema.loadSignatures, err => setImmediate(waterCb, err, res.body.signatures));
            });
        },
        function (signatures, waterCb) {
            library.sequence.add((cb) => {
                async.eachSeries(signatures, (signature, eachSeriesCb) => {
                    async.eachSeries(signature.signatures, (s, eachSeriesCb) => {
                        modules.multisignatures.processSignature({
                            signature: s,
                            transaction: signature.transaction
                        }, err => setImmediate(eachSeriesCb(err)));
                    }, eachSeriesCb);
                }, cb);
            }, waterCb);
        }
    ], err => setImmediate(cb, err));
};

/**
 * Gets a random peer and loads transactions calling the api.
 * Validates each transaction from peer and remove peer if invalid.
 * Calls processUnconfirmedTransaction for each transaction.
 * @private
 * @implements {Loader.getNetwork}
 * @implements {modules.transport.getFromPeer}
 * @implements {library.schema.validate}
 * @implements {async.eachSeries}
 * @implements {library.logic.transaction.objectNormalize}
 * @implements {modules.peers.remove}
 * @implements {library.balancesSequence.add}
 * @implements {modules.transactions.processUnconfirmedTransaction}
 * @param {function} cb
 * @return {setImmediateCallback} cb, err
 * @todo missed error propagation when balancesSequence.add
 */
__private.loadTransactions = function (cb) {
    async.waterfall([
        function (waterCb) {
            self.getNetwork((err, network) => {
                if (err) {
                    return setImmediate(waterCb, err);
                }
                const peer = network.peers[Math.floor(Math.random() * network.peers.length)];
                return setImmediate(waterCb, null, peer);
            });
        },
        function (peer, waterCb) {
            library.logger.log(`Loading transactions from: ${peer.string}`);

            modules.transport.getFromPeer(peer, {
                api: '/transactions',
                method: 'GET'
            }, (err, res) => {
                if (err) {
                    return setImmediate(waterCb, err);
                }

                library.schema.validate(res.body, schema.loadTransactions, (err) => {
                    if (err) {
                        return setImmediate(waterCb, err[0].message);
                    }
                    return setImmediate(waterCb, null, peer, res.body.transactions);
                });
            });
        },
        function (peer, transactions, waterCb) {
            async.eachSeries(transactions, (transaction, eachSeriesCb) => {
                const id = (transaction ? transactions.id : 'null');

                try {
                    transaction = library.logic.transaction.objectNormalize(transaction);
                } catch (e) {
                    library.logger.debug('Transaction normalization failed', {
                        id,
                        err: e.toString(),
                        module: 'loader',
                        tx: transaction
                    });

                    library.logger.warn(['Transaction', id, 'is not valid, peer removed'].join(' '), peer.string);
                    modules.peers.remove(peer);

                    return setImmediate(eachSeriesCb, e);
                }

                return setImmediate(eachSeriesCb);
            }, err => setImmediate(waterCb, err, transactions));
        },
        function (transactions, waterCb) {
            async.eachSeries(transactions, (transaction, eachSeriesCb) => {
                library.balancesSequence.add((cb) => {
                    transaction.bundled = true;
                    modules.transactions.processUnconfirmedTransaction(transaction, false, cb);
                }, (err) => {
                    if (err) {
                        // TODO: Validate if must include error propagation.
                        library.logger.debug(err);
                    }
                    return setImmediate(eachSeriesCb);
                });
            }, waterCb);
        }
    ], err => setImmediate(cb, err));
};

/**
 * Checks mem tables:
 * - count blocks from `blocks` table
 * - get genesis block from `blocks` table
 * - count accounts from `mem_accounts` table by block id
 * - get rounds from `mem_round`
 * Matchs genesis block with database.
 * Verifies Snapshot mode.
 * Recreates memory tables when neccesary:
 *  - Calls logic.account to removeTables and createTables
 *  - Calls block to load block. When blockchain ready emits a bus message.
 * Detects orphaned blocks in `mem_accounts` and gets delegates.
 * Loads last block and emits a bus message blockchain is ready.
 * @private
 * @implements {library.db.task}
 * @implements {modules.rounds.calc}
 * @implements {library.bus.message}
 * @implements {library.logic.account.removeTables}
 * @implements {library.logic.account.createTables}
 * @implements {async.until}
 * @implements {modules.blocks.loadBlocksOffset}
 * @implements {modules.blocks.deleteAfterBlock}
 * @implements {modules.blocks.loadLastBlock}
 * @emits exit
 * @throws {string} When fails to match genesis block with database
 */
Loader.prototype.loadBlockChain = function (cb) {
    let offset = 0,
        limit = Number(library.config.loading.loadPerIteration) || 1000;
    let verify = true;
    const verifyOnLoading = Boolean(library.config.loading.verifyOnLoading);

    function load(count) {
        __private.total = count;

        async.series({
            removeTables(seriesCb) {
                library.logic.account.removeTables((err) => {
                    if (err) {
                        throw err;
                    } else {
                        return setImmediate(seriesCb);
                    }
                });
            },
            createTables(seriesCb) {
                library.logic.account.createTables((err) => {
                    if (err) {
                        throw err;
                    } else {
                        return setImmediate(seriesCb);
                    }
                });
            },
            loadBlocksOffset(seriesCb) {
                async.until(
                    () => count < offset, (untilCb) => {
                        if (count > 1) {
                            library.logger.info(`Rebuilding blockchain, current block height: ${offset + 1}`);
                        }
                        modules.blocks.process.loadBlocksOffset(limit, offset, verify, (err, lastBlock) => {
                            if (err) {
                                return setImmediate(untilCb, err);
                            }

                            offset += limit;
                            __private.lastBlock = lastBlock;

                            return setImmediate(untilCb);
                        });
                    }, err => setImmediate(seriesCb, err)
                );
            },
            updateUsersListView(seriesCb) {
                // TODO: make it NORMAL
                const sql = new pgp.QueryFile(path.join(process.cwd(), 'src/sql', 'updateUsersListView.sql'), { minify: true });

                library.db.query(sql).then(() => setImmediate(seriesCb)).catch((err) => {
                    throw err;
                });
            }
        }, (err) => {
            if (err) {
                library.logger.error(err);
                if (err.block) {
                    library.logger.error(`Blockchain failed at: ${err.block.height}`);
                    modules.blocks.chain.deleteAfterBlock(err.block.id, () => {
                        library.logger.error('Blockchain clipped');
                        library.bus.message('blockchainReady');
                    });
                }
            } else {
                library.logger.info('Blockchain ready');
                library.bus.message('blockchainReady');
            }

            return setImmediate(cb);
        });
    }

    function reload(count, message) {
        if (message) {
            library.logger.warn(message);
            library.logger.warn('Recreating memory tables');
        }

        return load(count);
    }

    function checkMemTables(t) {
        const promises = [
            t.one(sql.countBlocks),
            t.query(sql.getGenesisBlock),
            t.one(sql.countMemAccounts),
            t.query(sql.getMemRounds),
            t.query(sql.countDuplicatedDelegates)
        ];

        return t.batch(promises);
    }

    function matchGenesisBlock(row) {
        if (row) {
            const matched = (
                row.id === __private.genesisBlock.block.id &&
                row.payloadHash.toString('hex') === __private.genesisBlock.block.payloadHash &&
                row.blockSignature.toString('hex') === __private.genesisBlock.block.blockSignature
            );
            if (matched) {
                library.logger.info('Genesis block matched with database');
            } else {
                throw 'Failed to match genesis block with database';
            }
        }
    }

    function verifySnapshot(count, round) {
        if (library.config.loading.snapshot !== undefined || library.config.loading.snapshot > 0) {
            library.logger.info('Snapshot mode enabled');

            if (isNaN(library.config.loading.snapshot) || library.config.loading.snapshot >= round) {
                library.config.loading.snapshot = round;

                if ((count === 1) || (count % constants.activeDelegates > 0)) {
                    library.config.loading.snapshot = (round > 1) ? (round - 1) : 1;
                }

                modules.rounds.setSnapshotRounds(library.config.loading.snapshot);
            }

            library.logger.info(`Snapshotting to end of round: ${library.config.loading.snapshot}`);
            return true;
        }
        return false;
    }

    library.db.task(checkMemTables).then((results) => {
        const count = results[0].count;

        library.logger.info(`Blocks ${count}`);

        const round = modules.rounds.calc(count);

        if (count === 1) {
            return reload(count);
        }

        matchGenesisBlock(results[1][0]);

        if (verifyOnLoading) {
            verify = verifySnapshot(count, round);

            if (verify) {
                return reload(count, 'Blocks verification enabled');
            }
        }

        const unapplied = results[3].filter(row => (row.round !== String(round)));

        if (unapplied.length > 0) {
            return reload(count, 'Detected unapplied rounds in mem_round');
        }

        const duplicatedDelegates = +results[4][0].count;

        if (duplicatedDelegates > 0) {
            library.logger.error('Delegates table corrupted with duplicated entries');
            return process.emit('exit');
        }

        function updateMemAccounts(t) {
            const promises = [
                t.none(sql.updateMemAccounts),
                t.query(sql.getDelegates),
                t.none(sql.clearUDelegates),
                t.none(sql.refreshUDelegates)
            ];

            return t.batch(promises);
        }

        library.db.task(updateMemAccounts).then((results) => {
            if (results[1].length === 0) {
                return reload(count, 'No delegates found');
            }

            modules.blocks.utils.loadLastBlock((err, block) => {
                if (err) {
                    return reload(count, err || 'Failed to load last block');
                }
                __private.lastBlock = block;
                library.logger.info('Blockchain ready');
                library.bus.message('blockchainReady');

                return setImmediate(cb);
            });
        });
    }).catch((err) => {
        library.logger.error(err.stack || err);
        return process.emit('exit');
    });
};

/**
 * Loads blocks from network.
 * @private
 * @implements {Loader.getNetwork}
 * @implements {async.whilst}
 * @implements {modules.blocks.lastBlock.get}
 * @implements {modules.blocks.loadBlocksFromPeer}
 * @implements {modules.blocks.getCommonBlock}
 * @param {function} cb
 * @return {setImmediateCallback} cb, err
 */
__private.loadBlocksFromNetwork = function (cb) {
    let testCount = 0;
    let loaded = false;

    self.getNetwork((err, network) => {
        if (err) {
            return setImmediate(cb, err);
        }

        let peers = [];
        if (network.peers.length <= 5) {
            peers = network.peers;
        } else {
            // TODO exclude duplicate
            peers = Array.from(new Array(5)).map(
                () => network.peers[Math.floor(Math.random() * network.peers.length)]
            );
        }

        async.whilst(
            () => !loaded && testCount < 5,
            (next) => {
                const peer = peers[testCount || 0];
                if (!peer) {
                    testCount += 1;
                    return next();
                }

                let lastBlock = modules.blocks.lastBlock.get();

                function loadBlocks() {
                    __private.blocksToSync = peer.height;

                    modules.blocks.process.loadBlocksFromPeer(peer, (loadBlocksFromPeerErr, lastValidBlock) => {
                        if (loadBlocksFromPeerErr) {
                            library.logger.error(loadBlocksFromPeerErr.toString());
                            library.logger.error(`Failed to load blocks from: ${peer.string}`);
                            testCount += 1;
                        }
                        loaded = lastValidBlock.id === lastBlock.id;
                        lastValidBlock = lastBlock = null;
                        next();
                    });
                }

                function getCommonBlock(getCommonBlockCb) {
                    library.logger.info(`Looking for common block with: ${peer.string}`);
                    if (peer.height < lastBlock.height) {
                        testCount += 1;
                        return next();
                    }

                    modules.blocks.process.getCommonBlock(peer, lastBlock.height, (getCommonBlockErr, commonBlock) => {
                        if (!commonBlock) {
                            if (getCommonBlockErr) {
                                library.logger.error(getCommonBlockErr.toString());
                            }
                            library.logger.error(`Failed to find common block with: ${peer.string}`);
                            testCount += 1;
                            return next();
                        }
                        library.logger.info(['Found common block:', commonBlock.id, 'with:', peer.string].join(' '));
                        library.logger.debug(`Found common block: ${JSON.stringify(commonBlock)}`);
                        return setImmediate(getCommonBlockCb);
                    });
                }

                if (lastBlock.height === 1) {
                    loadBlocks();
                } else {
                    getCommonBlock(loadBlocks);
                }
            },
            (err) => {
                if (err) {
                    library.logger.error('Failed to load blocks from network', err);
                    return setImmediate(cb, err);
                }
                return setImmediate(cb);
            }
        );
    });
};

/**
 * - Undoes unconfirmed transactions.
 * - Establish broadhash consensus
 * - Syncs: loadBlocksFromNetwork, updateSystem
 * - Establish broadhash consensus
 * - Applies unconfirmed transactions
 * @private
 * @implements {async.series}
 * @implements {modules.transactions.undoUnconfirmedList}
 * @implements {modules.transport.getPeers}
 * @implements {__private.loadBlocksFromNetwork}
 * @implements {modules.system.update}
 * @implements {modules.transactions.applyUnconfirmedList}
 * @param {function} cb
 * @todo check err actions
 */
__private.sync = function (cb) {
    library.logger.info('Starting sync');
    library.bus.message('syncStarted');

    __private.isActive = true;
    __private.syncTrigger(true);

    async.series({
        getPeersBefore(seriesCb) {
            library.logger.debug('Establishing broadhash consensus before sync');
            return modules.transport.getPeers({ limit: constants.maxPeers }, seriesCb);
        },
        loadBlocksFromNetwork(seriesCb) {
            return __private.loadBlocksFromNetwork(seriesCb);
        },
        updateSystem(seriesCb) {
            return modules.system.update(seriesCb);
        },
        getPeersAfter(seriesCb) {
            library.logger.debug('Establishing broadhash consensus after sync');
            return modules.transport.getPeers({ limit: constants.maxPeers }, seriesCb);
        },
    }, (err) => {
        __private.isActive = false;
        __private.syncTrigger(false);
        __private.blocksToSync = 0;

        if (firstSync) {
            library.bus.message('blockchainReadyForForging');
            firstSync = false;
        }

        library.logger.info('Finished sync');
        library.bus.message('syncFinished');
        return setImmediate(cb, err);
    });
};

/*
 * Given a list of peers (with associated blockchain height), we find a list
 * of good peers (likely to sync with), then perform a histogram cut, removing
 * peers far from the most common observed height. This is not as easy as it
 * sounds, since the histogram has likely been made accross several blocks,
 * therefore need to aggregate).
 */
/**
 * Gets the list of good peers.
 * @private
 * @implements {modules.blocks.lastBlock.get}
 * @implements {library.logic.peers.create}
 * @param {number} heights
 * @return {Object} {height number, peers array}
 */
__private.findGoodPeers = function (peers) {
    library.logger.debug(`[loader][findGoodPeers] peers: ${JSON.stringify(peers)}`);
    const lastBlockHeight = modules.blocks.lastBlock.get().height;
    library.logger.debug('Good peers - received', { count: peers.length });
    library.logger.debug('Good peers - received', { peers: JSON.stringify(peers) });

    peers = peers.filter(item => item && item.height >= lastBlockHeight);

    library.logger.debug('Good peers - filtered', { count: peers.length });
    library.logger.debug('Good peers - filtered', { peers: JSON.stringify(peers) });

    // No peers found
    if (peers.length === 0) {
        return { height: 0, peers: [] };
    }
    // Ordering the peers with descending height
    peers = peers.sort((a, b) => b.height - a.height);

    const histogram = {};
    let max = 0;
    let height;

    // Aggregating height by 2. TODO: To be changed if node latency increases?
    const aggregation = 2;

    // Histogram calculation, together with histogram maximum
    for (const i in peers) {
        const val = parseInt(peers[i].height / aggregation) * aggregation;
        histogram[val] = (histogram[val] ? histogram[val] : 0) + 1;

        if (histogram[val] > max) {
            max = histogram[val];
            height = val;
        }
    }

    // Performing histogram cut of peers too far from histogram maximum
    const goodPeers = peers.filter(item => item && Math.abs(height - item.height) < aggregation + 1).map(item => library.logic.peers.create(item));

    library.logger.debug('Good peers - accepted', { count: goodPeers.length });
    library.logger.debug('Good peers', goodPeers);

    return { height, peers: goodPeers };
};

// Public methods

// Rationale:
// - We pick 100 random peers from a random peer (could be unreachable).
// - Then for each of them we grab the height of their blockchain.
// - With this list we try to get a peer with sensibly good blockchain height (see __private.findGoodPeers for actual strategy).
/**
 * Gets good peers.
 * @implements {modules.blocks.lastBlock.get}
 * @implements {modules.peers.list}
 * @implements {__private.findGoodPeers}
 * @param {function} cb
 * @return {setImmediateCallback} err | __private.network (good peers)
 */
Loader.prototype.getNetwork = function (cb) {
    library.logger.debug(`[Loader][getNetwork]`);
    modules.peers.list({}, (err, peers) => {
        if (err) {
            return setImmediate(cb, err);
        }

        __private.network = __private.findGoodPeers(peers);

        if (!__private.network.peers.length) {
            return setImmediate(cb, 'Failed to find enough good peers');
        }
        return setImmediate(cb, null, __private.network);
    });
};

/**
 * Checks if private variable syncIntervalId have value.
 * @return {boolean} True if syncIntervalId have value
 */
Loader.prototype.syncing = function () {
    return !!__private.syncIntervalId;
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {*} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Loader.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

/**
 * Checks if `modules` is loaded.
 * @return {boolean} True if `modules` is loaded.
 */
Loader.prototype.isLoaded = function () {
    return !!modules;
};

// Events
/**
 * Pulls Transactions and signatures.
 * @implements {__private.syncTimer}
 * @implements {async.series}
 * @implements {async.retry}
 * @implements {__private.loadTransactions}
 * @implements {__private.loadSignatures}
 * @implements {__private.initialize}
 * @return {function} calls to __private.syncTimer()
 */
Loader.prototype.onPeersReady = function () {
    library.logger.trace('Peers ready', { module: 'loader' });
    // Enforce sync early
    __private.syncTimer();

    setImmediate(() => {
        async.series({
            loadTransactions(seriesCb) {
                if (__private.loaded) {
                    async.retry(__private.retries, __private.loadTransactions, (err) => {
                        if (err) {
                            library.logger.log('Unconfirmed transactions loader', err);
                        }

                        return setImmediate(seriesCb);
                    });
                } else {
                    return setImmediate(seriesCb);
                }
            },
            loadSignatures(seriesCb) {
                if (__private.loaded) {
                    async.retry(__private.retries, __private.loadSignatures, (err) => {
                        if (err) {
                            library.logger.log('Signatures loader', err);
                        }

                        return setImmediate(seriesCb);
                    });
                } else {
                    return setImmediate(seriesCb);
                }
            }
        }, (err) => {
            library.logger.trace('Transactions and signatures pulled');

            if (err) {
                __private.initialize();
            }
        });
    });
};

/**
 * Assigns needed modules from scope to private modules variable.
 * Calls __private.loadBlockChain
 * @param {modules} scope
 */
Loader.prototype.onBind = function (scope) {
    modules = {
        transactions: scope.transactions,
        blocks: scope.blocks,
        peers: scope.peers,
        rounds: scope.rounds,
        transport: scope.transport,
        multisignatures: scope.multisignatures,
        system: scope.system,
    };
};

/**
 * Sets private variable loaded to true.
 */
Loader.prototype.onBlockchainReady = function () {
    __private.loaded = true;
};

/**
 * Sets private variable loaded to false.
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Loader.prototype.cleanup = function (cb) {
    __private.loaded = false;
    return setImmediate(cb);
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Loader.prototype.internal = {
    statusPing() {
        return modules.blocks.lastBlock.isFresh();
    }
};

// Shared API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Loader.prototype.shared = {
    status(req, cb) {
        return setImmediate(cb, null, {
            loaded: __private.loaded,
            now: __private.lastBlock.height,
            blocksCount: __private.total
        });
    },

    sync(req, cb) {
        return setImmediate(cb, null, {
            syncing: self.syncing(),
            blocks: __private.blocksToSync,
            height: modules.blocks.lastBlock.get().height,
            broadhash: modules.system.getBroadhash(),
            consensus: modules.transport.consensus()
        });
    }
};

// Export
module.exports = Loader;


/** ************************************* END OF FILE ************************************ */
