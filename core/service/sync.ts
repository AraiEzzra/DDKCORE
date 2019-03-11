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

//  TODO get from env
const MIN_CONSENSUS = 51;

export interface ISyncService {

    requestPeers(): void;

    sendPeers(peer: Peer): void;

    connectNewPeers(peers: Array<Peer>): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    checkCommonBlock(): Promise<void>;

    requestBlocks(block: Block, peer: Peer): void;

    sendBlocks(data: { height: number, limit: number }, peer: Peer): void;

    consensus: boolean;
}

export class SyncService implements ISyncService {

    requestPeers(): void {
        SyncRepository.requestPeers();
    }

    sendPeers(peer): void {
        SyncRepository.sendPeers(peer);
    }

    connectNewPeers(peers: Array<Peer>): void {
        peers.forEach(peer => SocketRepository.connectNewPeer(peer));
    }

    sendNewBlock(block: Block): void {
        SyncRepository.sendNewBlock(block);
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
            logger.error('ERROR: last block is undefined');
        }
        if (this.checkBlockConsensus(lastBlock) || lastBlock.height === 1) {
            this.requestBlocks(lastBlock);
        } else {

            const randomPeer = PeerRepository.getRandomPeer(
                PeerRepository.getPeersByFilter(lastBlock.height, SystemRepository.broadhash)
            );
            if (!randomPeer) {
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
                this.checkCommonBlock();
            }
        }
    }

    requestBlocks(lastBlock, peer = null): void {
        SyncRepository.requestBlocks({ height: lastBlock.height + 1, limit: 42 }, peer);
    }

    sendBlocks(data: { height: number, limit: number }, peer): void {
        const blocks = BlockRepository.getMany(data.height, data.limit);
        SyncRepository.sendBlocks(blocks, peer);
    }

    requestCommonBlocks(block): void {
        SyncRepository.requestCommonBlocks(block);
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

    getBlockConsensus(block: Block) {
        const peers = PeerRepository.peerList();
        const commonPeers = peers.filter(peer => PeerRepository.checkCommonBlock(peer, block));
        if (!peers.length) {
            return 0;
        }
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
        if (!peers.length) {
            return 0;
        }
        return commonPeers.length / peers.length * TOTAL_PERCENTAGE;
    }

    get consensus(): boolean {
        return this.getConsensus() >= MIN_CONSENSUS;
    }
}

export default new SyncService();
