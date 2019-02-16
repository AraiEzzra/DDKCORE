import { Peer } from 'shared/model/peer';
import { getRandomInt } from 'core/util/common';
import { TRUSTED_PEERS } from 'core/repository/socket';

export class PeerRepo {
    private peers: { [string: string]: Peer } = {};
    private static _instance: PeerRepo;

    constructor() {
        if (PeerRepo._instance) {
            return PeerRepo._instance;
        }
        PeerRepo._instance = this;
    }

    addPeer(peer: Peer, socket): boolean {
        if (!this.has(peer)) {
            peer.socket = socket;

            this.peers[`${peer.ip}:${peer.port}`] = peer;
            return true;
        }
        return false;
    }

    removePeer(peer: Peer): void {
        console.log(`disconnect peer ${peer.ip}:${peer.port}`);
        delete this.peers[`${peer.ip}:${peer.port}`];

    }

    peerList(): Array<Peer> {
        return Object.values(this.peers);
    }

    getPeerFromPool(peer) {
        return this.peers[`${peer.ip}:${peer.port}`];
    }

    has(peer) {
        if (`${peer.ip}:${peer.port}` in this.peers) {
            return true;
        }
        return false;
    }

    ban(peer) {
    }

    unban(peer) {
    }

    getRandomPeer(): Peer {
        const peers = Object.values(this.peers);
        return peers[getRandomInt(peers.length)];
    }

    getRandomTrustedPeer(): Peer {
        return TRUSTED_PEERS[getRandomInt(TRUSTED_PEERS.length)];
    }

    public getByFilter(filter) {
        return [];
    }

    public dbSave() {}
    public dbRead() {}
}

export default new PeerRepo();
