import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import headers from 'core/repository/system';
import BlockRepository from 'core/repository/block';
import PeerRepository from 'core/repository/peer';
import SyncRepository from 'core/repository/sync';
import SocketRepository from 'core/repository/socket';
import { TOTAL_PERCENTAGE } from 'core/util/const';
//  TODO get from env
const MIN_CONSENSUS = 51;

export interface ISyncService {

    requestPeers(): Promise<void>;

    sendPeers(peer: Peer): Promise<void>;

    connectNewPeers(peers: Array<Peer>): Promise<void>;

    sendNewBlock(block: Block): Promise<void>;

    sendUnconfirmedTransaction(trs: Transaction<any>): Promise<void>;

    requestBlocks(block: Block, peer: Peer): Promise<void>;

    sendBlocks(data: { height: number, limit: number }, peer: Peer): Promise<void>;

    consensus: boolean;
}

export class SyncService implements ISyncService {

    constructor() {
    }

    async requestPeers(): Promise<void> {
        SyncRepository.requestPeers();
    }

    async sendPeers(peer): Promise<void> {
        SyncRepository.sendPeers(peer);
    }

    async connectNewPeers(peers: Array<Peer>): Promise<void> {
        peers.forEach(peer => SocketRepository.connectNewPeer(peer));
    }

    async sendNewBlock(block: Block): Promise<void> {
        SyncRepository.sendNewBlock(block);
    }

    async sendUnconfirmedTransaction(trs: Transaction<any>): Promise<void> {
        SyncRepository.sendUnconfirmedTransaction(trs);
    }

    async requestBlocks(): Promise<void> {
        SyncRepository.requestBlocks({ height: headers.height, limit: 42 });
    }

    async sendBlocks(data: { height: number, limit: number }, peer): Promise<void> {
        const blocks = BlockRepository.getMany(data.height, data.limit);
        SyncRepository.sendBlocks(blocks, peer);
    }

        // TODO remove
    async requestCommonBlocks(): Promise<void> {
        const block = BlockRepository.getLastBlock();
        SyncRepository.requestCommonBlocks(block);
    }

    // TODO remove
    async checkCommonBlocks(block: Block, peer): Promise<void> {
        // const response = await BlockRepository.getCommonBlock(block);
        // SyncRepository.sendCommonBlocksExist(response, peer);
    }

    async updateHeaders(data: { lastBlock: Block }) {
        headers.setBroadhash(data.lastBlock);
        headers.addBlockIdInPool(data.lastBlock);
        headers.setHeight(data.lastBlock);
        SyncRepository.sendHeaders(
            headers.getHeaders()
        );
    }

    getConsensus(): number {
        const peers = PeerRepository.peerList();
        const commonPeers = peers.filter(peer => peer.broadhash === headers.broadhash);
        return commonPeers.length / peers.length * TOTAL_PERCENTAGE;
    }

    get consensus(): boolean {
        return this.getConsensus() >= MIN_CONSENSUS;
    }
}

export default new SyncService();
