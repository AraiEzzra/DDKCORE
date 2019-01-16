const _ = require('lodash');
const async = require('async');
const constants = require('../helpers/constants.js');
const pgp = require('pg-promise')(); // We also initialize library here
const sandboxHelper = require('../helpers/sandbox.js');
const schema = require('../schema/peers.js');
const sql = require('../sql/peers.js');
const Peer = require('../logic/peer');

// Private fields
let modules;
let library;
let self;
const __private = {};

// Constructor
function Peers(cb, scope) {
    library = scope;
    self = this;

    setImmediate(cb, null, self);
}

// Private methods
__private.countByFilter = function (filter, cb) {
    __private.getByFilter(filter, (err, peers) => setImmediate(cb, null, peers.length));
};

__private.getByFilter = function (filter, cb) {
    const allowedFields = ['ip', 'port', 'state', 'os', 'version', 'broadhash', 'height'];
    const limit = filter.limit ? Math.abs(filter.limit) : null;
    const offset = filter.offset ? Math.abs(filter.offset) : 0;
    // Sorting peers
    const sortPeers = function (field, asc) {
        return function (a, b) {
            const sortResult =
                // Nulls last
                a[field] === b[field] ? 0 :
                    a[field] === null ? 1 :
                        b[field] === null ? -1 :
                            // Ascending
                            asc ? (a[field] < b[field] ? -1 : 1) :
                                // Descending
                                (a[field] < b[field] ? 1 : -1);
            return sortResult;
        };
    };
    // Randomizing peers (using Fisher-Yates-Durstenfeld shuffle algorithm)
    const shuffle = function (array) {
        let m = array.length,
            t,
            i;
        // While there remain elements to shuffle
        while (m) {
            // Pick a remaining element
            i = Math.floor(Math.random() * m--);
            // And swap it with the current element
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    };

    // Apply filters (by AND)
    let peers = library.logic.peers.list(true);
    peers = peers.filter((peer) => {
        // let peer = __private.peers[index];
        let passed = true;
        _.each(filter, (value, key) => {
            // Special case for dapp peers
            if (key === 'dappid' && (peer[key] === null || (Array.isArray(peer[key]) && !_.includes(peer[key], String(value))))) {
                passed = false;
                return false;
            }
            // Every filter field need to be in allowed fields, exists and match value
            if (_.includes(allowedFields, key) && !(peer[key] !== undefined && peer[key] === value)) {
                passed = false;
                return false;
            }
        });
        return passed;
    });

    // Sorting
    if (filter.orderBy) {
        const sort_arr = String(filter.orderBy).split(':');
        const sort_field = sort_arr[0] ? (_.includes(allowedFields, sort_arr[0]) ? sort_arr[0] : null) : null;
        const sort_method = (sort_arr.length === 2) ? (sort_arr[1] !== 'desc') : true;
        if (sort_field) {
            peers.sort(sortPeers(sort_field, sort_method));
        }
    } else {
        // Sort randomly by default
        peers = shuffle(peers);
    }

    // Apply limit if supplied
    if (limit) {
        peers = peers.slice(offset, (offset + limit));
    } else if (offset) {
        peers = peers.slice(offset);
    }
    return setImmediate(cb, null, peers);
};

__private.removeBans = function (cb) {
    const now = Date.now();
    _.each(library.logic.peers.list(), (peer) => {
        if (peer.clock && peer.clock <= now) {
            library.logic.peers.unban(peer);
        }
    });
    return setImmediate(cb);
};

__private.insertSeeds = function (cb) {
    let updated = 0;
    library.logger.trace('Peers->insertSeeds');
    async.each(library.config.peers.list, (peer, eachCb) => {
        peer = library.logic.peers.create(peer);
        library.logger.trace(`Processing seed peer: ${peer.string}`);
        self.ping(peer, () => {
            ++updated;
            return setImmediate(eachCb);
        });
    }, () => {
        library.logger.trace('Peers->insertSeeds - Peers discovered', {
            updated,
            total: library.config.peers.list.length
        });
        return setImmediate(cb);
    });
};

__private.dbLoad = function (cb) {
    let updated = 0;
    library.logger.trace('Importing peers from database');
    library.db.any(sql.getAll).then((rows) => {
        library.logger.info('Imported peers from database', { count: rows.length });
        async.each(rows, (peer, eachCb) => {
            peer = library.logic.peers.create(peer);

            if (library.logic.peers.exists(peer)) {
                peer = library.logic.peers.get(peer);
                if (peer && peer.state > 0 && Date.now() - peer.updated > 3000) {
                    self.ping(peer, () => {
                        ++updated;
                        return setImmediate(eachCb);
                    });
                } else {
                    return setImmediate(eachCb);
                }
            } else {
                self.ping(peer, () => {
                    ++updated;
                    return setImmediate(eachCb);
                });
            }
        }, () => {
            library.logger.trace('Peers->dbLoad Peers discovered', { updated, total: rows.length });
            return setImmediate(cb);
        });
    }).catch((err) => {
        library.logger.error('Import peers from database failed', { error: err.message || err });
        return setImmediate(cb);
    });
};

__private.dbSave = function (cb) {
    const peers = library.logic.peers.list(true);

    // Do nothing when peers list is empty
    if (!peers.length) {
        library.logger.debug('Export peers to database failed: Peers list empty');
        return setImmediate(cb);
    }

    // Creating set of columns
    const cs = new pgp.helpers.ColumnSet([
        'ip', 'port', 'state', 'height', 'os', 'version', 'clock',
        {
            name: 'broadhash',
            init(col) {
                return col.value ? new Buffer(col.value, 'hex') : null;
            }
        }
    ], { table: 'peers' });

    // Wrap sql queries in transaction and execute
    library.db.tx((t) => {
        // Generating insert query
        const insert_peers = pgp.helpers.insert(peers, cs);

        const queries = [
            // Clear peers table
            t.none(sql.clear),
            // Insert all peers
            t.none(insert_peers)
        ];

        // Inserting dapps peers
        _.each(peers, (peer) => {
            if (peer.dappid) {
                // If there are dapps on peer - push separately for every dapp
                _.each(peer.dappid, (dappid) => {
                    const dapp_peer = peer;
                    dapp_peer.dappid = dappid;
                    queries.push(t.none(sql.addDapp, peer));
                });
            }
        });

        return t.batch(queries);
    }).then(() => {
        library.logger.info('Peers exported to database');
        return setImmediate(cb);
    }).catch((err) => {
        library.logger.error('Export peers to database failed', { error: err.message || err });
        return setImmediate(cb);
    });
};

// Public methods
Peers.prototype.sandboxApi = function (call, args, cb) {
    sandboxHelper.callMethod(this.shared, call, args, cb);
};

Peers.prototype.update = function (peer) {
    peer.state = Peer.STATE.CONNECTED;
    return library.logic.peers.upsert(peer);
};

Peers.prototype.remove = function (peer) {
    const frozenPeer = _.find(library.config.peers.list, innerPeer => innerPeer.ip === peer.ip && innerPeer.port === peer.port);
    if (frozenPeer) {
        // FIXME: Keeping peer frozen is bad idea at all
        library.logger.info('Cannot remove frozen peer', `${peer.ip}:${peer.port}`);
        peer.state = Peer.STATE.DISCONNECTED;
        library.logic.peers.upsert(peer);
    } else {
        return library.logic.peers.remove(peer);
    }
};

Peers.prototype.ban = function (pip, port, seconds) {
    const frozenPeer = _.find(library.config.peers, peer => peer.ip === pip && peer.port === port);
    if (frozenPeer) {
        // FIXME: Keeping peer frozen is bad idea at all
        library.logger.debug('Cannot ban frozen peer', `${pip}:${port}`);
    } else {
        return library.logic.peers.ban(pip, port, seconds);
    }
};

Peers.prototype.ping = function (peer, cb) {
    library.logger.trace(`Pinging peer: ${peer.string}`);
    modules.transport.getFromPeer(peer, {
        api: '/height',
        method: 'GET'
    }, (err) => {
        if (err) {
            library.logger.trace(`Ping peer failed: ${peer.string}`, err);
            return setImmediate(cb, err);
        }
        return setImmediate(cb);
    });
};

Peers.prototype.discover = function (cb) {
    library.logger.trace('Peers->discover');
    function getFromRandomPeer(waterCb) {
        modules.transport.getFromRandomPeer({
            api: '/list',
            method: 'GET'
        }, (err, res) => setImmediate(waterCb, err, res));
    }

    function validatePeersList(res, waterCb) {
        library.schema.validate(res.body, schema.discover.peers, err => setImmediate(waterCb, err, res.body.peers));
    }

    function pickPeers(peers, waterCb) {
        const picked = self.acceptable(peers);
        library.logger.debug(['Picked', picked.length, 'of', peers.length, 'peers'].join(' '));
        return setImmediate(waterCb, null, picked);
    }

    function updatePeers(peers, waterCb) {
        async.each(peers, (peer, eachCb) => {
            peer = library.logic.peers.create(peer);

            library.schema.validate(peer, schema.discover.peer, (err) => {
                if (err) {
                    library.logger.warn(['Rejecting invalid peer:', peer.string].join(' '), { err });
                    return setImmediate(eachCb);
                }

                if (library.config.peers.access.blackList.indexOf(peer.ip) !== -1) {
                    library.logger.info(`Skip peer from black list: ${peer.string}`);
                    return setImmediate(eachCb);
                }

                // Set peer state to disconnected
                peer.state = 1;
                // We rely on data from other peers only when new peer is discovered for the first time
                library.logic.peers.upsert(peer, true);
                return setImmediate(eachCb);
            });
        }, () => {
            library.logger.trace('Peers discovered', peers.length);
            return setImmediate(waterCb);
        });
    }

    async.waterfall([
        getFromRandomPeer,
        validatePeersList,
        pickPeers,
        updatePeers
    ], err => setImmediate(cb, err));
};

Peers.prototype.acceptable = function (peers) {
    return _.chain(peers).filter(() =>
        // Removing peers with private or address or with the same nonce
        true//! ip.isPrivate(peer.ip) && peer.nonce !== library.nonce;
    ).uniqWith((a, b) =>
        // Removing non-unique peers
    (a.ip + a.port) === (b.ip + b.port)).value();
};

Peers.prototype.list = function (options, cb) {
    options.limit = options.limit || constants.maxPeers;
    options.broadhash = options.broadhash || modules.system.getBroadhash();
    options.attempts = ['matched broadhash', 'unmatched broadhash'];
    options.attempt = 0;
    options.matched = 0;
    function randomList(options, peers, cb) {
        // Get full peers list (random)
        __private.getByFilter({}, (err, peersList) => {
            let accepted,
                found,
                matched,
                picked;

            found = peersList.length;
            // TODO fix filtered only frozen
            // https://trello.com/c/Wwn9m2Ja/191-return-broadhash-validation-for-peer-picking

            if (constants.ONLY_FROZEN_PEERS_ENABLED) {
                peersList = peersList.filter(
                    peer => library.config.peers.list.map(p => p.ip).indexOf(peer.ip) !== -1 &&
                    [Peer.STATE.CONNECTED].indexOf(peer.state) !== -1
                );
            }
            if (constants.BROADHASH_VALIDATION_ENABLED) {
                // Apply filters
                peersList = peersList.filter((peer) => {
                    if (options.broadhash) {
                        // Skip banned peers (state 0)
                        if ([Peer.STATE.CONNECTED].indexOf(peer.state) !== -1 && (options.attempt === 0)) {
                            return (peer.broadhash === options.broadhash);
                        }
                        return options.attempt === 1 ? (peer.broadhash !== options.broadhash) : false;
                    }
                    // Skip banned peers (state 0)
                    return [Peer.STATE.CONNECTED].indexOf(peer.state) !== -1;
                });
            }
            matched = peersList.length;
            // Apply limit
            peersList = peersList.slice(0, options.limit);
            picked = peersList.length;
            // Filter only connected peers
            accepted = self.acceptable(peers.concat(peersList)).filter(
                peer => [Peer.STATE.CONNECTED].indexOf(peer.state) !== -1
            );
            library.logger.debug(`Listing peers ${JSON.stringify({
                attempt: options.attempts[options.attempt],
                found,
                matched,
                picked,
                accepted: accepted.length
            })}`);
            return setImmediate(cb, null, accepted);
        });
    }

    async.waterfall([
        function (waterCb) {
            // Matched broadhash
            return randomList(options, [], waterCb);
        },
        function (peers, waterCb) {
            options.matched = peers.length;
            options.limit -= peers.length;
            ++options.attempt;
            if (options.limit > 0) {
                // Unmatched broadhash
                return randomList(options, peers, waterCb);
            }
            return setImmediate(waterCb, null, peers);
        }
    ], (err, peers) => {
        // Calculate consensus
        let consensus = Math.round(options.matched / peers.length * 100 * 1e2) / 1e2;
        consensus = isNaN(consensus) ? 0 : consensus;

        library.logger.debug(['Listing', peers.length, 'total peers'].join(' '));
        return setImmediate(cb, err, peers, consensus);
    });
};

// Events
Peers.prototype.onBind = function (scope) {
    modules = scope;
};

Peers.prototype.onBlockchainReady = function () {
    async.series({
        insertSeeds(seriesCb) {
            __private.insertSeeds(() => setImmediate(seriesCb));
        },
        importFromDatabase(seriesCb) {
            __private.dbLoad(() => setImmediate(seriesCb));
        },
        discoverNew(seriesCb) {
            self.discover(() => setImmediate(seriesCb));
        }
    }, () => {
        library.bus.message('peersReady');
    });
};

Peers.prototype.onPeersReady = function () {
    library.logger.trace('Peers ready');
    setImmediate(function nextSeries() {
        async.series({
            discoverPeers(seriesCb) {
                library.logger.trace('Discovering new peers...');
                self.discover((err) => {
                    if (err) {
                        library.logger.error('Discovering new peers failed', err);
                    }
                    return setImmediate(seriesCb);
                });
            },
            updatePeers(seriesCb) {
                let updated = 0;
                const peers = library.logic.peers.list();

                library.logger.trace('Updating peers', { count: peers.length });

                async.each(peers, (peer, eachCb) => {
                    // If peer is not banned and not been updated during last 3 sec - ping
                    if (peer && peer.state > 0 && (!peer.updated || Date.now() - peer.updated > 3000)) {
                        library.logger.trace('Updating peer', peer);
                        self.ping(peer, () => {
                            ++updated;
                            return setImmediate(eachCb);
                        });
                    } else {
                        return setImmediate(eachCb);
                    }
                }, () => {
                    library.logger.trace('Peers updated', { updated, total: peers.length });
                    return setImmediate(seriesCb);
                });
            },
            removeBans(seriesCb) {
                library.logger.trace('Checking peers bans...');

                __private.removeBans(() => setImmediate(seriesCb));
            }
        }, () =>
            // Loop in 10sec intervals (5sec + 5sec connect timeout from pingPeer)
            setTimeout(nextSeries, 5000));
    });
};

Peers.prototype.cleanup = function (cb) {
    // Save peers on exit
    __private.dbSave(() => setImmediate(cb));
};

Peers.prototype.isLoaded = function () {
    return !!modules;
};

// Shared API
Peers.prototype.shared = {
    count(req, cb) {
        async.series({
            connected(cb) {
                __private.countByFilter({ state: 2 }, cb);
            },
            disconnected(cb) {
                __private.countByFilter({ state: 1 }, cb);
            },
            banned(cb) {
                __private.countByFilter({ state: 0 }, cb);
            }
        }, (err, res) => {
            if (err) {
                return setImmediate(cb, 'Failed to get peer count');
            }

            return setImmediate(cb, null, res);
        });
    },

    getPeers(req, cb) {
        library.schema.validate(req.body, schema.getPeers, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            if (req.body.limit < 0 || req.body.limit > 100) {
                return setImmediate(cb, 'Invalid limit. Maximum is 100');
            }

            __private.getByFilter(req.body, (err, peers) => {
                if (err) {
                    return setImmediate(cb, 'Failed to get peers');
                }

                return setImmediate(cb, null, { peers });
            });
        });
    },


    getPeer(req, cb) {
        library.schema.validate(req.body, schema.getPeer, (err) => {
            if (err) {
                return setImmediate(cb, err[0].message);
            }

            __private.getByFilter({
                ip: req.body.ip,
                port: req.body.port
            }, (err, peers) => {
                if (err) {
                    return setImmediate(cb, 'Failed to get peer');
                }

                if (peers.length) {
                    return setImmediate(cb, null, { success: true, peer: peers[0] });
                }
                return setImmediate(cb, 'Peer not found');
            });
        });
    },

    /**
     * Returns information about version
     *
     * @public
     * @async
     * @method version
     * @param  {Object}   req HTTP request object
     * @param  {Function} cb Callback function
     * @return {Function} cb Callback function from params (through setImmediate)
     * @return {Object}   cb.err Always return `null` here
     * @return {Object}   cb.obj Anonymous object with version info
     * @return {String}   cb.obj.build Build information (if available, otherwise '')
     * @return {String}   cb.obj.commit Hash of last git commit (if available, otherwise '')
     * @return {String}   cb.obj.version Shift current version
     */
    version(req, cb) {
        return setImmediate(cb, null, {
            build: library.build,
            commit: library.lastCommit,
            version: constants.currentVersion,
            minVersion: modules.system.getMinVersion()
        });
    }
};

// Export
module.exports = Peers;

/** ************************************* END OF FILE ************************************ */
