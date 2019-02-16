import { Peer, PeerState } from 'shared/model/peer';
import PeerRepo from 'core/repository/peer';

const _ = require('lodash');

const logger = require('logger');
const config = require('config');

class PeerService {

    public removeBans() {
        const now = Date.now();
        _.each(PeerRepo.list(), (peer) => {
            if (peer.clock && peer.clock <= now) {
                PeerRepo.unban(peer);
            }
        });
    }

    public insertSeeds() {
        let updated = 0;
        config.peers.list.forEach((peer) => {
            peer = PeerRepo.create(peer);
            logger.trace(`Processing seed peer: ${peer.string}`);
            this.ping(peer);
            ++updated;
        });
    }

    public update(peer) {
        peer.state = PeerState.CONNECTED;
        return PeerRepo.upsert(peer);
    }

    public remove(peer) {
        // additional logic may be transferred to repo
        PeerRepo.upsert(peer);
        PeerRepo.remove(peer);
    }

    public ban(pip, port, seconds) {
        // additional logic may be transferred to repo
        PeerRepo.ban(pip, port, seconds);
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
        const peers: Array<Peer> = [];
        const consensus = '';
        PeerRepo.getByFilter({});
        return {
            peers,
            consensus
        };
    }

    public updatePeers() {
        let updated = 0;
        const peers = PeerRepo.list();

        peers.forEach((peer) => {
            this.ping(peer);
        });
    }
}

export default new PeerService();
