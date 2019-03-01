import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import SystemRepository from 'core/repository/system';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block/index';
import PeerRepository from 'core/repository/peer';
import SyncRepository from 'core/repository/sync';
import SocketRepository from 'core/repository/socket';
import { messageON } from 'shared/util/bus';
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

    async checkCommonBlock() {
        const lastBlock = BlockRepository.getLastBlock();
        if (this.checkBlockConsensus(lastBlock)) {
            await this.requestBlocks(lastBlock);
        } else {

            const randomPeer = PeerRepository.getRandomPeer(
                PeerRepository.getPeersByFilter(lastBlock.height, SystemRepository.broadhash)
            );
            const minHeight = Math.min(...randomPeer.blocksIds.keys());
            if (minHeight - lastBlock.height >= 100) {
                messageON('EMIT_REQUEST_COMMON_BLOCKS', {
                    block: lastBlock
                });
            } else {

                await BlockService.deleteLastBlock();
                messageON('EMIT_SYNC_BLOCKS', {
                    block: lastBlock
                });
            }
        }
    }


    async requestBlocks(lastBlock, peer = null): Promise<void> {
        SyncRepository.requestBlocks({ height: lastBlock.height, limit: 42 }, peer);
    }

    async sendBlocks(data: { height: number, limit: number }, peer): Promise<void> {
        const blocks = BlockRepository.getMany(data.height, data.limit);
        SyncRepository.sendBlocks(blocks, peer);
    }

    async requestCommonBlocks(block): Promise<void> {
        SyncRepository.requestCommonBlocks(block);
    }

    async checkCommonBlocks(block: Block, peer): Promise<void> {
        const isExist = await BlockRepository.isExist(block.id);
        SyncRepository.sendCommonBlocksExist({isExist, block}, peer);
    }

    async updateHeaders(data: { lastBlock: Block }) {
        SystemRepository.setBroadhash(data.lastBlock);
        SystemRepository.addBlockIdInPool(data.lastBlock);
        SystemRepository.setHeight(data.lastBlock);
        SyncRepository.sendHeaders(
            SystemRepository.getHeaders()
        );
    }

    getBlockConsensus(block: Block) {
        const peers = PeerRepository.peerList();
        const commonPeers = peers.filter(peer => PeerRepository.checkCommonBlock(peer, block));
        return commonPeers.length / peers.length * TOTAL_PERCENTAGE;
    }

    checkBlockConsensus(block: Block): boolean {
        return this.getBlockConsensus(block) >= MIN_CONSENSUS;
    }

    getConsensus(): number {
        const peers = PeerRepository.peerList();
        const commonPeers = peers.filter(peer => {
            return peer.broadhash === SystemRepository.broadhash;
        });
        return commonPeers.length / peers.length * TOTAL_PERCENTAGE;
    }


    get consensus(): boolean {
        return this.getConsensus() >= MIN_CONSENSUS;
    }

}

export default new SyncService();
