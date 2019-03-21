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
import config from 'shared/util/config';
import { logger } from 'shared/util/logger';
import RoundService from 'core/service/round';

//  TODO get from env
const MIN_CONSENSUS = 51;

export interface ISyncService {

    sendPeers(peer: Peer, requestId?): void;

    connectNewPeers(peers: Array<Peer>): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    checkCommonBlock(): Promise<void>;

    requestBlocks(block: Block, peer: Peer): void;

    sendBlocks(data: { height: number, limit: number }, peer: Peer): void;

    consensus: boolean;
}

export class SyncService implements ISyncService {

    sendPeers(peer, requestId): void {
        SyncRepository.sendPeers(peer, requestId);
    }

    connectNewPeers(peers: Array<Peer>): void {
        (peers || []).forEach(peer => SocketRepository.connectNewPeer(peer));
    }

    sendNewBlock(block: Block): void {
        block.relay += 1;
        if (block.relay < config.constants.MAX_RELAY) {
            SyncRepository.sendNewBlock(block);
        }
    }

    sendUnconfirmedTransaction(trs: Transaction<any>): void {
        trs.relay += 1;
        if (trs.relay < config.constants.MAX_RELAY) {
            SyncRepository.sendUnconfirmedTransaction(trs);
        }
    }

    async checkCommonBlock(): Promise<void> {
        const lastBlock = BlockRepository.getLastBlock();
        if (!lastBlock) {
            logger.error('last block is undefined');
        }
        if (this.checkBlockConsensus(lastBlock) || lastBlock.height === 1) {
            this.requestBlocks(lastBlock);
        } else {

            const randomPeer = PeerRepository.getRandomPeer(
                PeerRepository.getPeersByFilter(lastBlock.height, SystemRepository.broadhash)
            );
            if (!randomPeer) {
                messageON('WARM_UP_FINISHED');
                logger.error('[Service][Sync][checkCommonBlock]: Peer doesn`t found');
                return;
            }
            const minHeight = Math.min(...randomPeer.blocksIds.keys());
            if (minHeight > lastBlock.height) {
                messageON('EMIT_REQUEST_COMMON_BLOCKS', {
                    id: lastBlock.id,
                    height: lastBlock.height
                });
            } else {

                await BlockService.deleteLastBlock();
                await this.checkCommonBlock();
            }
        }
    }

    requestBlocks(lastBlock, peer = null): void {
        SyncRepository.requestBlocks({
            height: lastBlock.height + 1,
            limit: config.constants.REQUEST_BLOCK_LIMIT
        }, peer);
    }

    sendBlocks(data: { height: number, limit: number }, peer): void {
        const blocks = BlockRepository.getMany(data.limit, data.height);
        SyncRepository.sendBlocks(blocks, peer);
    }

    requestCommonBlocks(blockData: { id: string, height: number }): void {
        SyncRepository.requestCommonBlocks(blockData);
    }

    checkCommonBlocks(block: { id: string, height: number }, peer): void {
        const isExist = BlockRepository.isExist(block.id);
        SyncRepository.sendCommonBlocksExist({ isExist, block }, peer);
    }

    updateHeaders(lastBlock: Block) {
        SystemRepository.setBroadhash(lastBlock);
        SystemRepository.addBlockIdInPool(lastBlock);
        SystemRepository.setHeight(lastBlock);
        SyncRepository.sendHeaders(
            SystemRepository.getHeaders()
        );
    }

    getBlockConsensus(block: Block): number {
        const peers = PeerRepository.peerList();
        const commonPeers = peers.filter(peer => PeerRepository.checkCommonBlock(peer, block));
        if (!peers.length) {
            return 0;
        }
        return (commonPeers.length + 1) / (peers.length + 1) * TOTAL_PERCENTAGE;
    }

    checkBlockConsensus(block: Block): boolean {
        return this.getBlockConsensus(block) >= MIN_CONSENSUS;
    }

    getConsensus(): number {
        const peers = PeerRepository.peerList();
        const commonPeers = peers.filter(peer => {
            return peer.broadhash === SystemRepository.broadhash;
        });
        if (!peers.length) {
            return 0;
        }
        return (commonPeers.length + 1) / (peers.length + 1) * TOTAL_PERCENTAGE;
    }

    get consensus(): boolean {
        return this.getConsensus() >= MIN_CONSENSUS;
    }
}

export default new SyncService();
