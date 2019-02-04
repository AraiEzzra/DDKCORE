const async = require('async');
const Broadcaster = require('../logic/broadcaster.js');
const Peer = require('../logic/peer.js');
const bignum = require('../helpers/bignum.js');
const constants = require('../helpers/constants.js');
const crypto = require('crypto');
const extend = require('extend');
const popsicle = require('popsicle');
const schema = require('../schema/transport.js');
const sandboxHelper = require('../helpers/sandbox.js');
const sql = require('../sql/transport.js');
const sqlBlock = require('../sql/blocks.js');
const utils = require('../utils');
const usersList = require('../app.js');

// Private fields
let modules,
    library,
    self,
    __private = {},
    shared = {};

__private.headers = {};
__private.loaded = false;
__private.messages = {};

/**
 * Initializes library with scope content and generates a Broadcaster instance.
 * @memberof module:transport
 * @class
 * @classdesc Main Transport methods.
 * @param {function} cb - Callback function.
 * @param {scope} scope - App instance.
 * @return {setImmediateCallback} Callback function with `self` as data.
 */
// Constructor
function Transport(cb, scope) {
    library = {
        logger: scope.logger,
        db: scope.db,
        bus: scope.bus,
        schema: scope.schema,
        network: scope.network,
        balancesSequence: scope.balancesSequence,
        logic: {
            block: scope.logic.block,
            transaction: scope.logic.transaction,
            peers: scope.logic.peers,
        },
        config: {
            peers: {
                options: {
                    timeout: scope.config.peers.options.timeout,
                },
            },
            forging: {
                minBroadhashConsensus: scope.config.forging.minBroadhashConsensus,
            }
        },
    };
    self = this;

    __private.broadcaster = new Broadcaster(
        scope.config.broadcasts,
        scope.config.forging.force,
        scope.logic.peers,
        scope.logic.transaction,
        scope.logger
    );

    setImmediate(cb, null, self);
}

// Private methods
/**
 * Creates a sha256 hash based on input object.
 * @private
 * @implements {crypto.createHash}
 * @implements {bignum.fromBuffer}
 * @param {Object} obj
 * @return {string} Buffer array to string
 */
__private.hashsum = function (obj) {
    const buf = Buffer.from(JSON.stringify(obj), 'utf8');
    const hashdig = crypto.createHash('sha256').update(buf).digest();
    const temp = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
        temp[i] = hashdig[7 - i];
    }

    return bignum.fromBuffer(temp).toString();
};

/**
 * Removes a peer based on ip and port.
 * @private
 * @implements {modules.peers.remove}
 * @param {Object} options - Contains code and peer
 * @param {string} extraMessage
 */
__private.removePeer = function (options, extraMessage) {
    library.logger.debug([options.code, 'Removing peer', options.peer.string, extraMessage].join(' '));
    modules.peers.remove(options.peer);
};

/**
 * Validates signatures body and for each signature calls receiveSignature.
 * @private
 * @implements {library.schema.validate}
 * @implements {__private.receiveSignature}
 * @param {Object} query
 * @param {function} cb
 * @return {setImmediateCallback} cb, err
 */
__private.receiveSignatures = function (query, cb) {
    let signatures;

    async.series({
        validateSchema(seriesCb) {
            library.schema.validate(query, schema.signatures, (err) => {
                if (err) {
                    return setImmediate(seriesCb, 'Invalid signatures body');
                }
                return setImmediate(seriesCb);
            });
        },
        receiveSignatures(seriesCb) {
            signatures = query.signatures;

            async.eachSeries(signatures, (signature, eachSeriesCb) => {
                __private.receiveSignature(signature, (err) => {
                    if (err) {
                        library.logger.debug(err, signature);
                    }

                    return setImmediate(eachSeriesCb);
                });
            }, seriesCb);
        }
    }, err => setImmediate(cb, err));
};

/**
 * Validates signature with schema and calls processSignature.
 * @private
 * @implements {library.schema.validate}
 * @implements {modules.multisignatures.processSignature}
 * @param {signature} signature
 * @return {setImmediateCallback} cb | error messages
 */
__private.receiveSignature = function (signature, cb) {
    library.schema.validate({ signature }, schema.signature, (err) => {
        if (err) {
            return setImmediate(cb, 'Invalid signature body');
        }

        modules.multisignatures.processSignature(signature, (err) => {
            if (err) {
                return setImmediate(cb, `Error processing signature: ${err}`);
            }
            return setImmediate(cb);
        });
    });
};

/**
 * Validates transactions with schema and calls receiveTransaction for each
 * transaction.
 * @private
 * @implements {library.schema.validate}
 * @implements {__private.receiveTransaction}
 * @param {Object} query - Contains transactions
 * @param {peer} peer
 * @param {string} extraLogMessage
 * @param {function} cb
 * @return {setImmediateCallback} cb, err
 */
__private.receiveTransactions = function (query, peer, extraLogMessage, cb) {
    let transactions;

    async.series({
        validateSchema(seriesCb) {
            library.schema.validate(query, schema.transactions, (err) => {
                if (err) {
                    return setImmediate(seriesCb, 'Invalid transactions body');
                }
                return setImmediate(seriesCb);
            });
        },
        receiveTransactions(seriesCb) {
            transactions = query.transactions;

            async.eachSeries(transactions, (transaction, eachSeriesCb) => {
                transaction.bundled = true;

                __private.receiveTransaction(transaction, peer, extraLogMessage, (err) => {
                    if (err) {
                        library.logger.debug(err, transaction);
                    }

                    return setImmediate(eachSeriesCb);
                });
            }, seriesCb);
        }
    }, err => setImmediate(cb, err));
};

/**
 * Normalizes transaction and remove peer if it fails.
 * Calls balancesSequence.add to receive transaction and
 * processUnconfirmedTransaction to confirm it.
 * @private
 * @implements {library.logic.transaction.objectNormalize}
 * @implements {__private.removePeer}
 * @implements {library.balancesSequence.add}
 * @implements {modules.transactions.processUnconfirmedTransaction}
 * @param {transaction} transaction
 * @param {peer} peer
 * @param {string} extraLogMessage
 * @param {function} cb
 * @return {setImmediateCallback} cb, error message
 */
// TODO rewrite it later
__private.receiveTransaction = (transaction, peer, extraLogMessage, cb) => {
    const id = (transaction ? transaction.id : 'null');

    try {
        transaction = library.logic.transaction.objectNormalize(transaction);
    } catch (e) {
        library.logger.debug('Transaction normalization failed', {
            id,
            err: e.toString(),
            module: 'transport',
            tx: transaction
        });

        __private.removePeer({ peer, code: 'ETRANSACTION' }, extraLogMessage);

        return setImmediate(cb, `Invalid transaction body - ${e.toString()}`);
    }
    modules.transactions.putInQueue(transaction);
    return setImmediate(cb, null, transaction.id);
};

// Public methods
/**
 * Sets or gets headers
 * @param {Object} [headers]
 * @return {Object} private variable with headers
 */
Transport.prototype.headers = function (headers) {
    if (headers) {
        __private.headers = headers;
    }

    return __private.headers;
};

/**
 * Gets consensus
 * @return {number} broadcaster consensus
 */
Transport.prototype.consensus = function () {
    return __private.broadcaster.consensus;
};

/**
 * Returns true if broadcaster consensus is less than minBroadhashConsensus.
 * Returns false if consensus is undefined.
 * @return {boolean}
 */
Transport.prototype.poorConsensus = function () {
    if (__private.broadcaster.consensus === undefined) {
        return false;
    }
    return (__private.broadcaster.consensus < library.config.forging.minBroadhashConsensus);
};

/**
 * Calls getPeers method from Broadcaster class.
 * @implements {Broadcaster.getPeers}
 * @param {Object} params
 * @param {function} cb
 * @return {Broadcaster.getPeers} calls getPeers
 */
Transport.prototype.getPeers = function (params, cb) {
    return __private.broadcaster.getPeers(params, cb);
};

/**
 * Calls peers.list based on config options to get peers, calls getFromPeer
 * with first peer from list.
 * @implements {modules.peers.list}
 * @implements {getFromPeer}
 * @param {Object} config
 * @param {function|Object} options
 * @param {function} cb
 * @return {setImmediateCallback|getFromPeer} error | calls getFromPeer
 */
Transport.prototype.getFromRandomPeer = function (config, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = config;
        config = {};
    }
    config.limit = 1;
    config.allowedStates = [Peer.STATE.DISCONNECTED, Peer.STATE.CONNECTED];
    modules.peers.list(config, (err, peers) => {
        if (!err && peers.length) {
            return self.getFromPeer(peers[0], options, cb);
        }
        return setImmediate(cb, err || 'No acceptable peers found');
    });
};

/**
 * Requests information from peer(ip, port, url) and validates response:
 * - status 200
 * - headers valid schema
 * - same network (response headers nethash)
 * - compatible version (response headers version)
 * Removes peer if error, updates peer otherwise
 * @requires {popsicle}
 * @implements {library.logic.peers.create}
 * @implements {library.schema.validate}
 * @implements {modules.system.networkCompatible}
 * @implements {modules.system.versionCompatible}
 * @implements {modules.peers.update}
 * @implements {__private.removePeer}
 * @param {peer} peer
 * @param {Object} options
 * @param {function} cb
 * @return {setImmediateCallback|Object} error message | {body, peer}
 * @todo implements secure http request with https
 */
Transport.prototype.getFromPeer = function (peer, options, cb) {
    let url;

    if (options.api) {
        url = `/peer${options.api}`;
    } else {
        url = options.url;
    }

    peer = library.logic.peers.create(peer);
    __private.headers.port = 7007;
    const req = {
        url: `http://${peer.ip}:${peer.port}${url}`,
        method: options.method,
        headers: __private.headers,
        timeout: library.config.peers.options.timeout
    };

    if (options.data) {
        req.body = options.data;
    }

    popsicle.request(req)
        .use(popsicle.plugins.parse(['json'], false))
        .then((res) => {
            if (res.status !== 200) {
                // Remove peer
                __private.removePeer({ peer, code: `ERESPONSE ${res.status}` }, `${req.method} ${req.url}`);

                return setImmediate(cb, ['Received bad response code', res.status, req.method, req.url].join(' '));
            }
            const headers = peer.applyHeaders(res.headers);

            const report = library.schema.validate(headers, schema.headers);
            if (!report) {
                // Remove peer
                __private.removePeer({ peer, code: 'EHEADERS' }, `${req.method} ${req.url}`);

                return setImmediate(cb, ['Invalid response headers', JSON.stringify(headers), req.method, req.url].join(' '));
            }

            if (!modules.system.networkCompatible(headers.nethash)) {
                // Remove peer
                __private.removePeer({ peer, code: 'ENETHASH' }, `${req.method} ${req.url}`);

                return setImmediate(cb, ['Peer is not on the same network', headers.nethash, req.method, req.url].join(' '));
            }

            if (!modules.system.versionCompatible(headers.version)) {
                // Remove peer
                __private.removePeer({ peer, code: `EVERSION:${headers.version}` }, `${req.method} ${req.url}`);

                return setImmediate(cb, ['Peer is using incompatible version', headers.version, req.method, req.url].join(' '));
            }

            modules.peers.update(peer);

            return setImmediate(cb, null, { body: res.body, peer });
        }).catch((err) => {
        if (peer) {
            __private.removePeer({ peer, code: err.code }, `${req.method} ${req.url}`);
        }

        return setImmediate(cb, [err.code, 'Request failed', req.method, req.url].join(' '));
    });
};

/**
 * Calls helpers.sandbox.callMethod().
 * @implements module:helpers#callMethod
 * @param {function} call - Method to call.
 * @param {*} args - List of arguments.
 * @param {function} cb - Callback function.
 */
Transport.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(shared, call, args, cb);
};

// Events
/**
 * Bounds scope to private broadcaster amd initialize headers.
 * @implements {modules.system.headers}
 * @implements {broadcaster.bind}
 * @param {modules} scope - Loaded modules.
 */
Transport.prototype.onBind = function (scope) {
    modules = {
        blocks: scope.blocks,
        dapps: scope.dapps,
        peers: scope.peers,
        multisignatures: scope.multisignatures,
        transactions: scope.transactions,
        system: scope.system,
    };

    __private.headers = modules.system.headers();
    __private.broadcaster.bind(
        scope.peers,
        scope.transport,
        scope.transactions
    );
};

/**
 * Sets private variable loaded to true
 */
Transport.prototype.onBlockchainReady = function () {
    __private.loaded = true;

    __private.broadcaster.registerJobs();
};

// /**
//  * Calls enqueue signatures and emits a 'signature/change' socket message.
//  * @implements {Broadcaster.maxRelays}
//  * @implements {Broadcaster.enqueue}
//  * @implements {library.network.io.sockets.emit}
//  * @param {signature} signature
//  * @param {Object} broadcast
//  * @emits signature/change
//  */
// Transport.prototype.onSignature = function (signature, broadcast) {
//     if (broadcast && !__private.broadcaster.maxRelays(signature)) {
//         __private.broadcaster.enqueue({}, { api: '/signatures', data: { signature }, method: 'POST' });
//         library.network.io.sockets.emit('signature/change', signature);
//     }
// };

Transport.prototype.onTransactionPutInPool = (transaction) => {
    library.logger.debug(`[Transport][onTransactionPutInPool][transaction] ${JSON.stringify(transaction)}`);
    if (!__private.broadcaster.maxRelays(transaction)) {
        __private.broadcaster.enqueue({}, { api: '/transactions', data: { transaction }, method: 'POST' });
        library.network.io.sockets.emit('transactions/change', transaction);
    }
};

/**
 * Calls broadcast blocks and emits a 'blocks/change' socket message.
 * @implements {modules.system.getBroadhash}
 * @implements {Broadcaster.maxRelays}
 * @implements {Broadcaster.broadcast}
 * @implements {library.network.io.sockets.emit}
 * @param {block} block
 * @param {Object} broadcast
 * @emits blocks/change
 */
Transport.prototype.onNewBlock = function (block, broadcast) {
    library.db.one(sqlBlock.getBlockByHeight, { height: block.height })
    .then((lastBlock) => {
        block.username = lastBlock.m_username;
        library.network.io.sockets.emit('blocks/change', block);
        utils.addDocument({
            index: 'blocks_list',
            type: 'blocks_list',
            body: lastBlock,
            id: lastBlock.b_id
        });
    });

    if (broadcast) {
        const broadhash = modules.system.getBroadhash();
        modules.system.update(() => {
            if (!__private.broadcaster.maxRelays(block)) {
                __private.broadcaster.broadcast({ limit: constants.maxPeers, broadhash }, {
                    api: '/blocks',
                    data: { block },
                    method: 'POST',
                    immediate: true
                });
            }
        });
    }
};

/**
 * Calls broadcast '/dapp/message'.
 * @implements {Broadcaster.maxRelays}
 * @implements {Broadcaster.broadcast}
 * @param {Object} msg
 * @param {Object} broadcast
 */
Transport.prototype.onMessage = function (msg, broadcast) {
    if (broadcast && !__private.broadcaster.maxRelays(msg)) {
        __private.broadcaster.broadcast({ limit: constants.maxPeers, dappid: msg.dappid }, {
            api: '/dapp/message',
            data: msg,
            method: 'POST',
            immediate: true
        });
    }
};

/**
 * Sets loaded to false.
 * @param {function} cb
 * @return {setImmediateCallback} cb
 */
Transport.prototype.cleanup = function (cb) {
    __private.loaded = false;
    return setImmediate(cb);
};

/**
 * Returns true if modules are loaded and private variable loaded is true.
 * @return {boolean}
 */
Transport.prototype.isLoaded = function () {
    return modules && __private.loaded;
};

// Internal API
/**
 * @todo implement API comments with apidoc.
 * @see {@link http://apidocjs.com/}
 */
Transport.prototype.internal = {
    blocksCommon(ids, peer, extraLogMessage, cb) {
        const escapedIds = ids
        // Remove quotes
            .replace(/['"]+/g, '')
            // Separate by comma into an array
            .split(',')
            // Reject any non-numeric values
            .filter(id => /^[0-9a-fA-F]+$/.test(id));

        if (!escapedIds.length) {
            library.logger.debug('Common block request validation failed', { err: 'ESCAPE', req: ids });

            __private.removePeer({ peer, code: 'ECOMMON' }, extraLogMessage);

            return setImmediate(cb, 'Invalid block id sequence');
        }

        library.db.query(sql.getCommonBlock, [escapedIds]).then(rows => setImmediate(cb, null, {
            success: true,
            common: rows[0] || null
        })).catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Failed to get common block');
        });
    },

    blocks(query, cb) {
        // Get 34 blocks with all data (joins) from provided block id
        // According to maxium payload of 58150 bytes per block with every transaction being a vote
        // Discounting maxium compression setting used in middleware
        // Maximum transport payload = 2000000 bytes
        modules.blocks.utils.loadBlocksData({
            limit: 34, // 1977100 bytes
            lastId: query.lastBlockId
        }, (err, data) => {
            if (err) {
                return setImmediate(cb, err);
            }

            return setImmediate(cb, null, { blocks: data });
        });
    },

    postBlock(block, peer, extraLogMessage, cb) {
        try {
            block = library.logic.block.objectNormalize(block);
        } catch (e) {
            library.logger.debug('Block normalization failed', { err: e.toString(), module: 'transport', block });

            __private.removePeer({ peer, code: 'EBLOCK' }, extraLogMessage);

            return setImmediate(cb, null, { success: false, error: e.toString() });
        }

        library.bus.message('receiveBlock', block);

        return setImmediate(cb, null, { success: true, blockId: block.id });
    },

    list(req, cb) {
        modules.peers.list({ limit: constants.maxPeers }, (err, peers) => {
            peers = (!err ? peers : []);
            return setImmediate(cb, null, { success: !err, peers });
        });
    },

    height(req, cb) {
        return setImmediate(cb, null, { success: true, height: modules.blocks.lastBlock.get().height });
    },

    ping(req, cb) {
        return setImmediate(cb, null, { success: true });
    },

    postSignatures(query, cb) {
        if (query.signatures) {
            __private.receiveSignatures(query, (err) => {
                if (err) {
                    return setImmediate(cb, null, { success: false, message: err });
                }
                return setImmediate(cb, null, { success: true });
            });
        } else {
            __private.receiveSignature(query.signature, (err) => {
                if (err) {
                    return setImmediate(cb, null, { success: false, message: err });
                }
                return setImmediate(cb, null, { success: true });
            });
        }
    },

    getSignatures(req, cb) {
        const transactions = modules.transactions.getMultisignatureTransactionList(true, constants.maxSharedTxs);
        const signatures = [];

        async.eachSeries(transactions, (trs, __cb) => {
            if (trs.signatures && trs.signatures.length) {
                signatures.push({
                    transaction: trs.id,
                    signatures: trs.signatures
                });
            }

            return setImmediate(__cb);
        }, () => setImmediate(cb, null, { success: true, signatures }));
    },

    getTransactions(req, cb) {
        const res = modules.transactions.getMergedTransactionList(true, constants.maxSharedTxs);

        return setImmediate(cb, null, { success: true, ...res });
    },

    postTransactions(query, peer, extraLogMessage, cb) {
        if (query.transactions) {
            __private.receiveTransactions(query, peer, extraLogMessage, (err) => {
                if (err) {
                    return setImmediate(cb, null, { success: false, message: err });
                }
                return setImmediate(cb, null, { success: true });
            });
        } else {
            __private.receiveTransaction(query.transaction, peer, extraLogMessage, (err, id) => {
                if (err) {
                    return setImmediate(cb, null, { success: false, message: err });
                }
                return setImmediate(cb, null, { success: true, transactionId: id });
            });
        }
    },

    postDappMessage(query, cb) {
        try {
            if (!query.dappid) {
                return setImmediate(cb, null, { success: false, message: 'Missing dappid' });
            }
            if (!query.timestamp || !query.hash) {
                return setImmediate(cb, null, { success: false, message: 'Missing hash sum' });
            }
            const newHash = __private.hashsum(query.body, query.timestamp);
            if (newHash !== query.hash) {
                return setImmediate(cb, null, { success: false, message: 'Invalid hash sum' });
            }
        } catch (e) {
            library.logger.error(e.stack);
            return setImmediate(cb, null, { success: false, message: e.toString() });
        }

        if (__private.messages[query.hash]) {
            return setImmediate(cb, null);
        }

        __private.messages[query.hash] = true;

        modules.dapps.message(query.dappid, query.body, (err, body) => {
            if (!err && body.error) {
                err = body.error;
            }

            if (err) {
                return setImmediate(cb, null, { success: false, message: err.toString() });
            }
            library.bus.message('message', query, true);
            return setImmediate(cb, null, extend({}, body, { success: true }));
        });
    },

    postDappRequest(query, cb) {
        try {
            if (!query.dappid) {
                return setImmediate(cb, null, { success: false, message: 'Missing dappid' });
            }
            if (!query.timestamp || !query.hash) {
                return setImmediate(cb, null, { success: false, message: 'Missing hash sum' });
            }

            const newHash = __private.hashsum(query.body, query.timestamp);
            if (newHash !== query.hash) {
                return setImmediate(cb, null, { success: false, message: 'Invalid hash sum' });
            }
        } catch (e) {
            library.logger.error(e.stack);
            return setImmediate(cb, null, { success: false, message: e.toString() });
        }

        modules.dapps.request(query.dappid, query.body.method, query.body.path, query.body.query, (err, body) => {
            if (!err && body.error) {
                err = body.error;
            }

            if (err) {
                return setImmediate(cb, null, { success: false, message: err });
            }
            return setImmediate(cb, null, extend({}, body, { success: true }));
        });
    },

    handshake(ip, port, headers, validateHeaders, cb) {
        const peer = library.logic.peers.create(
            {
                ip,
                port
            }
        );

        headers = peer.applyHeaders(headers);

        validateHeaders(headers, (error, extraMessage) => {
            if (error) {
                // Remove peer
                __private.removePeer({ peer, code: 'EHEADERS' }, extraMessage);

                return setImmediate(cb, { success: false, error });
            }

            if (!modules.system.networkCompatible(headers.nethash)) {
                // Remove peer
                __private.removePeer({ peer, code: 'ENETHASH' }, extraMessage);

                return setImmediate(cb, {
                    success: false,
                    message: 'Request is made on the wrong network',
                    expected: modules.system.getNethash(),
                    received: headers.nethash
                });
            }

            if (!modules.system.versionCompatible(headers.version)) {
                // Remove peer
                __private.removePeer({
                    peer,
                    code: `EVERSION:${headers.version}`
                }, extraMessage);

                return setImmediate(cb, {
                    success: false,
                    message: 'Request is made from incompatible version',
                    expected: modules.system.getMinVersion(),
                    received: headers.version
                });
            }

            modules.peers.update(peer);

            return setImmediate(cb, null, peer);
        });
    }
};

// Shared API
shared.message = function (msg, cb) {
    msg.timestamp = Math.floor(Date.now() / 1000);
    msg.hash = __private.hashsum(msg.body, msg.timestamp);

    __private.broadcaster.enqueue({ dappid: msg.dappid }, { api: '/dapp/message', data: msg, method: 'POST' });

    return setImmediate(cb, null, {});
};

shared.request = function (msg, cb) {
    msg.timestamp = Math.floor(Date.now() / 1000);
    msg.hash = __private.hashsum(msg.body, msg.timestamp);

    if (msg.body.peer) {
        self.getFromPeer({ ip: msg.body.peer.ip, port: msg.body.peer.port }, {
            api: '/dapp/request',
            data: msg,
            method: 'POST'
        }, cb);
    } else {
        self.getFromRandomPeer({ dappid: msg.dappid }, { api: '/dapp/request', data: msg, method: 'POST' }, cb);
    }
};

// Export
module.exports = Transport;

/** ************************************* END OF FILE ************************************ */
