import { Peer } from 'shared/model/peer';
import { getRandomInt } from 'core/util/common';
import { TRUSTED_PEERS } from 'core/repository/socket';
import headers from './system';
import { logger } from 'shared/util/logger';

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
        logger.debug(`disconnect peer ${peer.ip}:${peer.port}`);
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

    peerUpdate(headers, peer) {
        if (!this.has(peer)) {
            return;
        }
        Object.assign(this.peers[`${peer.ip}:${peer.port}`], headers)
    }

    ban(peer) {
    }

    unban(peer) {
    }

    getRandomPeers(limit: number = 5, peers: Array<Peer> = null): Array<Peer> {
        const peerList = peers || this.peerList();
        if (peerList.length <= limit) {
            return peerList;
        }
        const result = [];
        while (result.length < limit) {
            const peer = peerList[getRandomInt(peerList.length)];
            if (result.indexOf(peer) !== -1) {
                result.push(peer);
            }
        }
        return result;
    }

    getPeersByFilter(): Array<Peer> {
        return Object.values(this.peers).filter(peer => {
            return peer.height > headers.height
                && peer.broadhash !== headers.broadhash;
        });
    }

    getRandomTrustedPeer(): Peer {
        return TRUSTED_PEERS[getRandomInt(TRUSTED_PEERS.length)];
    }

    // TODO minheight > нашей && !consensus (broadhash не такой как наш)


    public getByFilter(filter) {
        return [];
    }

    public dbSave() {
    }

    public dbRead() {
    }
}

export default new PeerRepo();
