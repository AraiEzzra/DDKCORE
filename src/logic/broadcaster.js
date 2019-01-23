const async = require('async');
const constants = require('../helpers/constants.js');
const jobsQueue = require('../helpers/jobsQueue.js');
const extend = require('extend');
const _ = require('lodash');

// Private fields
let modules;
let library;
let self;
const __private = {};

/**
 * Initializes variables, sets Broadcast routes and timer based on
 * broadcast interval from config file.
 * @memberof module:transport
 * @class
 * @classdesc Main Broadcaster logic.
 * @implements {__private.releaseQueue}
 * @param {Object} broadcasts
 * @param {boolean} force
 * @param {Peers} peers - from logic, Peers instance
 * @param {Transaction} transaction - from logic, Transaction instance
 * @param {Object} logger
 */
// Constructor
function Broadcaster(broadcasts, force, peers, transaction, logger) {
    library = {
        logger,
        logic: {
            peers,
            transaction,
        },
        config: {
            broadcasts,
            forging: {
                force,
            },
        },
    };
    self = this;

    self.queue = [];
    self.config = library.config.broadcasts;
    self.config.peerLimit = constants.maxPeers;

    // Optionally ignore broadhash consensus
    if (library.config.forging.force) {
        self.consensus = undefined;
    } else {
        self.consensus = 100;
    }

    // Broadcast routes
    self.routes = [{
        path: '/transactions',
        collection: 'transactions',
        object: 'transaction',
        method: 'POST'
    }, {
        path: '/signatures',
        collection: 'signatures',
        object: 'signature',
        method: 'POST'
    }];

    // TODO implement new broadcast logic
    // https://trello.com/c/KQQq8E97/30-implement-new-broadcast-logic
    // Broadcaster timer
    function nextRelease(cb) {
        __private.releaseQueue((err) => {
            if (err) {
                library.logger.log('Broadcaster timer', err);
            }
            return setImmediate(cb);
        });
    }

    jobsQueue.register('broadcasterNextRelease', nextRelease, self.config.broadcastInterval);
}

// Public methods
/**
 * Binds input parameters to private variables modules.
 * @param {Peers} peers
 * @param {Transport} transport
 * @param {Transactions} transactions
 */
Broadcaster.prototype.bind = function (peers, transport, transactions) {
    modules = {
        peers,
        transport,
        transactions,
    };
};

/**
 * Calls peers.list function to get peers.
 * @implements {modules.peers.list}
 * @param {Object} params
 * @param {function} cb
 * @return {setImmediateCallback} err | peers
 */
Broadcaster.prototype.getPeers = function (params, cb) {
    params.limit = params.limit || self.config.peerLimit;
    params.broadhash = params.broadhash || null;

    const originalLimit = params.limit;

    modules.peers.list(params, (err, peers, consensus) => {
        if (err) {
            return setImmediate(cb, err);
        }

        if (self.consensus !== undefined && originalLimit === constants.maxPeers) {
            library.logger.info(['Broadhash consensus now', consensus, '%'].join(' '));
            self.consensus = consensus;
        }

        return setImmediate(cb, null, peers);
    });
};

/**
 * Adds new object {params, options} to queue array .
 * @param {Object} params
 * @param {Object} options
 * @return {Object[]} queue private variable with new data
 */
Broadcaster.prototype.enqueue = function (params, options) {
    options.immediate = false;
    return self.queue.push({ params, options });
};

/**
 * Gets peers and for each peer create it and broadcast.
 * @implements {getPeers}
 * @implements {library.logic.peers.create}
 * @param {Object} params
 * @param {Object} options
 * @param {function} cb
 * @return {setImmediateCallback} err | peers
 */
Broadcaster.prototype.broadcast = function (params, options, cb) {
    params.limit = params.limit || self.config.peerLimit;
    params.broadhash = params.broadhash || null;

    async.waterfall([
        function getPeers(waterCb) {
            if (!params.peers) {
                return self.getPeers(params, waterCb);
            }
            return setImmediate(waterCb, null, params.peers);
        },
        function getFromPeer(peers, waterCb) {
            library.logger.debug('Begin broadcast', options);

            if (params.limit === self.config.peerLimit) {
                peers = peers.slice(0, self.config.broadcastLimit);
            }

            async.eachLimit(peers, self.config.parallelLimit, (peer, eachLimitCb) => {
                peer = library.logic.peers.create(peer);

                modules.transport.getFromPeer(peer, options, (err) => {
                    if (err) {
                        library.logger.debug(`Failed to broadcast to peer: ${peer.string}`, err);
                    }
                    return setImmediate(eachLimitCb);
                });
            }, (err) => {
                library.logger.debug('End broadcast');
                return setImmediate(waterCb, err, peers);
            });
        }
    ], (err, peers) => {
        if (cb) {
            return setImmediate(cb, err, { body: null, peer: peers });
        }
    });
};

/**
 * Counts relays and valids limit.
 * @param {Object} object
 * @return {boolean} True if Broadcast relays exhausted
 */
Broadcaster.prototype.maxRelays = function (object) {
    if (!Number.isInteger(object.relays)) {
        object.relays = 0; // First broadcast
    }

    if (Math.abs(object.relays) >= self.config.relayLimit) {
        library.logger.debug('Broadcast relays exhausted', object);
        return true;
    }
    object.relays++; // Next broadcast
    return false;
};

// Private
/**
 * Filters private queue based on broadcasts.
 * @private
 * @implements {__private.filterTransaction}
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
__private.filterQueue = function (cb) {
    library.logger.debug(`Broadcasts before filtering: ${self.queue.length}`);

    async.filter(self.queue, (broadcast, filterCb) => {
        if (broadcast.options.immediate) {
            return setImmediate(filterCb, null, false);
        } else if (broadcast.options.data) {
            const transaction = (broadcast.options.data.transaction || broadcast.options.data.signature);
            return __private.filterTransaction(transaction, filterCb);
        }
        return setImmediate(filterCb, null, true);
    }, (err, broadcasts) => {
        self.queue = broadcasts;

        library.logger.debug(`Broadcasts after filtering: ${self.queue.length}`);
        return setImmediate(cb);
    });
};

/**
 * Checks if transaction is in pool or confirm it.
 * @private
 * @implements {modules.transactions.transactionInPool}
 * @implements {library.logic.transaction.checkConfirmed}
 * @param {transaction} transaction
 * @param {function} cb
 * @return {setImmediateCallback} cb, null, boolean
 */
__private.filterTransaction = function (transaction, cb) {
    if (transaction !== undefined) {
        if (modules.transactions.transactionInPool(transaction.id)) {
            return setImmediate(cb, null, true);
        }
        return library.logic.transaction.checkConfirmed(transaction, err => setImmediate(cb, null, !err));
    }
    return setImmediate(cb, null, false);
};

/**
 * Groups broadcasts by api.
 * @private
 * @param {Object} broadcasts
 * @return {Object[]} squashed routes
 */
__private.squashQueue = function (broadcasts) {
    const grouped = _.groupBy(broadcasts, broadcast => broadcast.options.api);

    const squashed = [];

    self.routes.forEach((route) => {
        if (Array.isArray(grouped[route.path])) {
            const data = {};

            data[route.collection] = grouped[route.path]
                .map(broadcast => broadcast.options.data[route.object])
                .filter(Boolean);

            squashed.push({
                options: { api: route.path, data, method: route.method },
                immediate: false
            });
        }
    });

    return squashed;
};

/**
 * Releases enqueued broadcasts:
 * - filterQueue
 * - squashQueue
 * - broadcast
 * @private
 * @implements {__private.filterQueue}
 * @implements {__private.squashQueue}
 * @implements {getPeers}
 * @implements {broadcast}
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
__private.releaseQueue = function (cb) {
    library.logger.debug('Releasing enqueued broadcasts');

    if (!self.queue.length) {
        library.logger.debug('Queue empty');
        return setImmediate(cb);
    }

    async.waterfall([
        function filterQueue(waterCb) {
            return __private.filterQueue(waterCb);
        },
        function squashQueue(waterCb) {
            const broadcasts = self.queue.splice(0, self.config.releaseLimit);
            return setImmediate(waterCb, null, __private.squashQueue(broadcasts));
        },
        function getPeers(broadcasts, waterCb) {
            self.getPeers({}, (err, peers) => setImmediate(waterCb, err, broadcasts, peers));
        },
        function broadcast(broadcasts, peers, waterCb) {
            async.eachSeries(broadcasts, (broadcastData, eachSeriesCb) => {
                self.broadcast(extend({ peers }, broadcastData.params), broadcastData.options, eachSeriesCb);
            }, err => setImmediate(waterCb, err, broadcasts));
        }
    ], (err, broadcasts) => {
        if (err) {
            library.logger.debug('Failed to release broadcast queue', err);
        } else {
            library.logger.debug(`Broadcasts released: ${broadcasts.length}`);
        }
        return setImmediate(cb);
    });
};

// Export
module.exports = Broadcaster;


/** ************************************* END OF FILE ************************************ */
