const _ = require('lodash');
const ip = require('ip');
const logger = require('logger');
import { Peer as PeerModel } from 'shared/model/peer';

class Peer extends PeerModel {

    constructor(peer) {
        super();
        return this.accept(peer || {});
    }

    private readonly properties = [
        'ip',
        'port',
        'state',
        'os',
        'version',
        'dappid',
        'broadhash',
        'height',
        'clock',
        'updated',
        'nonce'
    ];

    private readonly immutable = [
        'ip',
        'port',
        'string'
    ];

    private readonly headers = [
        'os',
        'version',
        'dappid',
        'broadhash',
        'height',
        'nonce'
    ];

    private readonly nullable = [
        'os',
        'version',
        'dappid',
        'broadhash',
        'height',
        'clock',
        'updated'
    ];

    private readonly STATE = {
        BANNED: 0,
        DISCONNECTED: 1,
        CONNECTED: 2
    };

    private accept(peer) {
        // Normalize peer data
        peer = this.normalize(peer);

        // Accept only supported and defined properties
        _.each(this.properties, (key) => {
            if (peer[key] !== null && peer[key] !== undefined) {
                this[key] = peer[key];
            }
        });

        // Adjust properties according to rules
        if (/^[0-9]+$/.test(this.ip)) {
            this.ip = ip.fromLong(this.ip);
        }

        if (this.ip && this.port) {
            this.string = `${this.ip}:${this.port}`;
        }

        return this;
    }

    private normalize(peer) {
        if (peer.dappid && !Array.isArray(peer.dappid)) {
            const dappid = peer.dappid;
            peer.dappid = [];
            peer.dappid.push(dappid);
        }

        if (peer.height) {
            peer.height = this.parseInt(peer.height, 1);
        }

        peer.port = this.parseInt(peer.port, 0);
        peer.state = this.parseInt(peer.state, this.STATE.DISCONNECTED);

        return peer;
    }

    private parseInt(integer, fallback) {
        integer = parseInt(integer, 10);
        integer = isNaN(integer) ? fallback : integer;

        return integer;
    }


    private applyHeaders(headers) {
        headers = headers || {};
        headers = this.normalize(headers);
        this.update(headers);
        return headers;
    }

    public update(peer) {
        peer = this.normalize(peer);

        // Accept only supported properties
        _.each(this.properties, (key) => {
            // Change value only when is defined
            if (peer[key] !== null && peer[key] !== undefined && !_.includes(this.immutable, key)) {
                this[key] = peer[key];
            }
        });

        return this;
    }

    public object() {
        const copy = {};

        _.each(this.properties, (key) => {
            copy[key] = this[key];
        });

        _.each(this.nullable, (key) => {
            if (!copy[key]) {
                copy[key] = null;
            }
        });

        return copy;
    }
}

export class PeerRepo {
    private peers: { [string: string] : Peer };

    constructor() {}

    public create(peer) {
        if (!(peer instanceof Peer)) {
            return new Peer(peer);
        }
        return peer;
    }

    public exists(peer) {
        peer = this.create(peer);
        return !!this.peers[peer.string];
    }

    public get(peer) {
        if (typeof peer === 'string') {
            return this.peers[peer];
        }
        peer = this.create(peer);
        return this.peers[peer.string];
    }

    public upsert(peer, insertOnly?) {
        // Insert new peer
        const insert = function (peerInsert) {
            peerInsert.updated = Date.now();
            this.peers[peerInsert.string] = peerInsert;

            logger.debug('Inserted new peer', peerInsert.string);
            logger.trace('Inserted new peer', { peer: peerInsert });
        };

        // Update existing peer
        const update = function (peerUpdate) {
            peerUpdate.updated = Date.now();

            const diff = {};
            _.each(peerUpdate, (value, key) => {
                if (key !== 'updated' && this.peers[peerUpdate.string][key] !== value) {
                    diff[key] = value;
                }
            });

            this.peers[peerUpdate.string].update(peerUpdate);

            if (Object.keys(diff).length) {
                logger.debug(`Updated peer ${peerUpdate.string}`, diff);
            } else {
                logger.trace('Peer not changed', peerUpdate.string);
            }
        };

        peer = this.create(peer);

        if (!peer.string) {
            logger.warn('Upsert invalid peer rejected', { peer });
            return false;
        }

        // Performing insert or update
        if (this.exists(peer)) {
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
        const state = 2;

        _.each(this.peers, (peerEnt) => {
            ++cntTotal;
            if (peerEnt.state === state) {
                ++cntActive;
            }
            if (!peerEnt.height) {
                ++cntEmptyHeight;
            }
            if (!peerEnt.broadhash) {
                ++cntEmptyBroadhash;
            }
        });

        logger.trace('Peer stats', {
            total: cntTotal,
            alive: cntActive,
            empty_height: cntEmptyHeight,
            empty_broadhash: cntEmptyBroadhash
        });

        return true;
    }

    public ban(ip, port, seconds) {
        const milestone = Date.now() + ((seconds || 1) * 1000);
        return this.upsert({
            ip,
            port,
            // State 0 for banned peer
            state: 0,
            clock: milestone
        });
    }

    public unban(peer) {
        peer = this.get(peer);
        if (peer) {
            delete peer.clock;
            peer.state = 1;
            logger.debug('Released ban for peer', peer.string);
        } else {
            logger.debug('Failed to release ban for peer', { err: 'INVALID', peer });
        }
        return peer;
    }

    public remove(peer) {
        peer = this.create(peer);
        // Remove peer if exists
        if (this.exists(peer)) {
            logger.info('Removed peer', peer.string);
            logger.debug('Removed peer', { peer: this.peers[peer.string] });
            this.peers[peer.string] = null; // Possible memory leak prevention
            delete this.peers[peer.string];
            return true;
        }
        logger.debug('Failed to remove peer', { err: 'AREMOVED', peer });
        return false;
    }

    public list(normalize) {
        if (normalize) {
            return Object.keys(this.peers).map(key => this.peers[key].object());
        }
        return Object.keys(this.peers).map(key => this.peers[key]);
    }
}
