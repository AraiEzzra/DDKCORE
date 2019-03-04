import { Peer } from 'shared/model/peer';
import { getRandomInt } from 'core/util/common';
import Headers from './system';

const env = require('../../config/env').default;
export const TRUSTED_PEERS: Array<any> = env.peers.list;
export const BLACK_LIST = new Set(env.blackList);
import { logger } from 'shared/util/logger';
import { Block } from 'shared/model/block';
import { MAX_PEER_BLOCKS_IDS } from 'core/util/const';

export class PeerRepo {
    private peers: { [string: string]: Peer } = {};
    private static instance: PeerRepo;

    constructor() {
        if (PeerRepo.instance) {
            return PeerRepo.instance;
        }
        PeerRepo.instance = this;
    }

    addPeer(peer: Peer, socket): boolean {
        if (!this.has(peer)) {
            peer.socket = socket;
            peer.blocksIds = new Map(peer.blocksIds);
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

    checkCommonBlock(peer: Peer, block: Block): boolean {
        peer = this.getPeerFromPool(peer);
        if (peer.blocksIds.has(block.height)
            && peer.blocksIds.get(block.height) === block.id
        ) {
            return true;
        }
        return false;
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
        logger.debug(`[PeerRepository][peerUpdate]: ${JSON.stringify(headers)}`);
        if (!this.has(peer)) {
            return;
        }
        const currentPeer = this.getPeerFromPool(peer);
        Object.assign(currentPeer, headers);

        currentPeer.blocksIds.set(headers.height, headers.broadhash);
        if (currentPeer.blocksIds.size > MAX_PEER_BLOCKS_IDS) {
            const min = Math.min(...currentPeer.blocksIds.keys());
            currentPeer.blocksIds.delete(min);
        }
        logger.debug(`[PeerRepository][peerBlocksIdsUpdated]: ${JSON.stringify([...currentPeer.blocksIds])}`);
    }

    ban(peer) {
    }

    unban(peer) {
    }

    getRandomPeer(peers: Array<Peer> = null): Peer {
        const peerList = peers || this.peerList();
        return peerList[getRandomInt(peerList.length)];
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

    getPeersByFilter(height): Array<Peer> {
        return this.peerList().filter(peer => {
            return peer.height >= height
                && peer.broadhash !== Headers.broadhash;
        });
    }

    getRandomTrustedPeer(): Peer {
        return TRUSTED_PEERS[getRandomInt(TRUSTED_PEERS.length)];
    }


    public getByFilter(filter) {
        return [];
    }

    public dbSave() {
    }

    public dbRead() {
    }
}

export default new PeerRepo();
