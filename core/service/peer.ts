import { Peer, PeerState } from 'shared/model/peer';
import { PeerRepo } from 'core/repository/peer';

const _ = require('lodash');

const logger = require('logger');
const config = require('config');

export class PeerService {
    private readonly peerRepo = new PeerRepo();

    constructor() { }

    // to repo
    private getByFilter(filter) {
        return [];
    }

    // ?
    private dbSave() {}
    private dbRead() {}

    public removeBans() {
        const now = Date.now();
        _.each(this.peerRepo.list(), (peer) => {
            if (peer.clock && peer.clock <= now) {
                this.peerRepo.unban(peer);
            }
        });
    }

    public insertSeeds() {
        let updated = 0;
        config.peers.list.forEach((peer) => {
            peer = this.peerRepo.create(peer);
            logger.trace(`Processing seed peer: ${peer.string}`);
            this.ping(peer);
            ++updated;
        });
    }

    public update(peer) {
        peer.state = PeerState.CONNECTED;
        return this.peerRepo.upsert(peer);
    }

    public remove(peer) {
        // additional logic may be transferred to repo
        this.peerRepo.upsert(peer);
        this.peerRepo.remove(peer);
    }

    public ban(pip, port, seconds) {
        // additional logic may be transferred to repo
        this.peerRepo.ban(pip, port, seconds);
    }

    public ping(peer) {
        // syncRepo call getFromRandomPeer GET/height
    }

    public discover() {

        function getFromRandomPeer() {
            // syncRepo call getFromRandomPeer GET/list
        }

        function pickPeers(peers) {
            const picked = this.acceptable(peers);
            return picked;
        }

        function updatePeers(peers) {
            peers.forEach((peer) => {
                peer.state = 1;
                this.peerRepo.upsert(peer, true);
            });
        }

        const peers = getFromRandomPeer();
        pickPeers(peers);
        updatePeers(peers);
    }

    public acceptable(peers) {
        return [];
    }

    public list(options?) {
        // system getBroadHash
        const peers = [];
        const consensus = '';
        this.getByFilter({});
        return {
            peers,
            consensus
        };
    }

    public updatePeers() {
        let updated = 0;
        const peers = this.peerRepo.list();

        peers.forEach((peer) => {
            this.ping(peer);
        });
    }
}
