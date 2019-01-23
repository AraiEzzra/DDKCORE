const _ = require('lodash');
const Peer = require('./peer.js');

// Private fields
const __private = {};
let self;
let modules;
let library;

// Constructor
function Peers(logger, cb) {
    // library = scope;
    library = { logger };
    self = this;
    __private.peers = {};
    return setImmediate(cb, null, this);
}

Peers.prototype.create = function (peer) {
    if (!(peer instanceof Peer)) {
        return new Peer(peer);
    }
    return peer;
};

Peers.prototype.exists = function (peer) {
    peer = self.create(peer);
    return !!__private.peers[peer.string];
};

Peers.prototype.get = function (peer) {
    if (typeof peer === 'string') {
        return __private.peers[peer];
    }
    peer = self.create(peer);
    return __private.peers[peer.string];
};

Peers.prototype.upsert = function (peer, insertOnly) {
    // Insert new peer
    const insert = function (peerInsert) {
        peerInsert.updated = Date.now();
        __private.peers[peerInsert.string] = peerInsert;

        library.logger.debug('Inserted new peer', peerInsert.string);
        library.logger.trace('Inserted new peer', { peer: peerInsert });
    };

    // Update existing peer
    const update = function (peerUpdate) {
        peerUpdate.updated = Date.now();

        const diff = {};
        _.each(peerUpdate, (value, key) => {
            if (key !== 'updated' && __private.peers[peerUpdate.string][key] !== value) {
                diff[key] = value;
            }
        });

        __private.peers[peerUpdate.string].update(peerUpdate);

        if (Object.keys(diff).length) {
            library.logger.debug(`Updated peer ${peerUpdate.string}`, diff);
        } else {
            library.logger.trace('Peer not changed', peerUpdate.string);
        }
    };

    peer = self.create(peer);

    if (!peer.string) {
        library.logger.warn('Upsert invalid peer rejected', { peer });
        return false;
    }

    // Performing insert or update
    if (self.exists(peer)) {
        // Skip update if insert-only is forced
        if (!insertOnly) {
            update(peer);
        } else {
            return false;
        }
    } else {
        insert(peer);
    }

    // Stats for tracking changes
    let cntTotal = 0;
    let cntActive = 0;
    let cntEmptyHeight = 0;
    let cntEmptyBroadhash = 0;

    _.each(__private.peers, (peer) => {
        ++cntTotal;
        if (peer.state === 2) {
            ++cntActive;
        }
        if (!peer.height) {
            ++cntEmptyHeight;
        }
        if (!peer.broadhash) {
            ++cntEmptyBroadhash;
        }
    });

    library.logger.trace('Peer stats', {
        total: cntTotal,
        alive: cntActive,
        empty_height: cntEmptyHeight,
        empty_broadhash: cntEmptyBroadhash
    });

    return true;
};

Peers.prototype.ban = function (ip, port, seconds) {
    return self.upsert({
        ip,
        port,
        // State 0 for banned peer
        state: 0,
        clock: Date.now() + ((seconds || 1) * 1000)
    });
};

Peers.prototype.unban = function (peer) {
    peer = self.get(peer);
    if (peer) {
        delete peer.clock;
        peer.state = 1;
        library.logger.debug('Released ban for peer', peer.string);
    } else {
        library.logger.debug('Failed to release ban for peer', { err: 'INVALID', peer });
    }
    return peer;
};

Peers.prototype.remove = function (peer) {
    peer = self.create(peer);
    // Remove peer if exists
    if (self.exists(peer)) {
        library.logger.info('Removed peer', peer.string);
        library.logger.debug('Removed peer', { peer: __private.peers[peer.string] });
        __private.peers[peer.string] = null; // Possible memory leak prevention
        delete __private.peers[peer.string];
        return true;
    }
    library.logger.debug('Failed to remove peer', { err: 'AREMOVED', peer });
    return false;
};

Peers.prototype.list = function (normalize) {
    if (normalize) {
        return Object.keys(__private.peers).map(key => __private.peers[key].object());
    }
    return Object.keys(__private.peers).map(key => __private.peers[key]);
};

// Public methods
Peers.prototype.bindModules = function (scope) {
    modules = scope.modules;
    library.logger.trace('Logic/Peers->bind');
};

// Export
module.exports = Peers;

/** ************************************* END OF FILE ************************************ */
