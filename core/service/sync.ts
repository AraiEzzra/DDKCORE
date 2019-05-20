import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import SystemRepository from 'core/repository/system';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block/index';
import PeerRepository from 'core/repository/peer';
import SyncRepository, { ERROR_NOT_ENOUGH_PEERS } from 'core/repository/sync';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import config from 'shared/config';
import { logger } from 'shared/util/logger';
import RoundService from 'core/service/round';
import SlotService from 'core/service/slot';
import RoundRepository from 'core/repository/round';
import SharedTransactionRepo from 'shared/repository/transaction';
import BlockController from 'core/controller/block';
import { ResponseEntity } from 'shared/model/response';
import { getLastSlotNumberInRound } from 'core/util/round';

//  TODO get from env
const MIN_CONSENSUS = 51;

export interface ISyncService {

    sendPeers(peer: Peer, requestId): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    checkCommonBlock(lastBlock: Block): Promise<ResponseEntity<{ isExist: boolean, peer?: Peer }>>;

    requestBlocks(lastBlock: Block, peer: Peer): Promise<ResponseEntity<Array<Block>>>;

    sendBlocks(data: { height: number, limit: number }, peer: Peer, requestId: string): void;

}

export class SyncService implements ISyncService {

    consensus: boolean;

    sendPeers(peer, requestId): void {
        SyncRepository.sendPeers(peer, requestId);
    }

    sendNewBlock(block: Block): void {
        block.relay += 1;
        if (block.relay < config.CONSTANTS.TRANSFER.MAX_BLOCK_RELAY) {
            SyncRepository.sendNewBlock(block);
        }
    }

    sendUnconfirmedTransaction(trs: Transaction<any>): void {
        trs.relay += 1;
        if (trs.relay < config.CONSTANTS.TRANSFER.MAX_TRS_RELAY) {
            SyncRepository.sendUnconfirmedTransaction(trs);
        }
    }

    async checkCommonBlock(lastBlock: Block): Promise<ResponseEntity<{ isExist: boolean, peer?: Peer }>> {

        const errors: Array<string> = [];
        const filteredPeers = PeerRepository.getPeersByFilter(lastBlock.height, SystemRepository.broadhash);

        if (!filteredPeers.length) {
            return new ResponseEntity({ errors: [ERROR_NOT_ENOUGH_PEERS] });
        }

        const randomPeer = PeerRepository.getRandomPeer(filteredPeers);
        if (!randomPeer) {
            errors.push(`random peer not found`);
            return new ResponseEntity({ errors });
        }

        if (this.checkBlockConsensus(lastBlock) || lastBlock.height === 1) {

            return new ResponseEntity({ data: { isExist: true, peer: randomPeer } });

        } else {

            const minHeight = Math.min(...randomPeer.blocksIds.keys());
            if (minHeight > lastBlock.height) {
                const response = await SyncRepository.requestCommonBlocks(
                    { id: lastBlock.id, height: lastBlock.height }
                );

                if (!response.success) {
                    errors.push(`response from peer not success`);
                    errors.push(...response.errors);
                    return new ResponseEntity({ errors });
                }
                const { isExist, peer } = response.data;
                if (isExist) {
                    return new ResponseEntity({ data: { peer, isExist } });
                }
            }
        }
        return new ResponseEntity({ data: { isExist: false } });
    }

    async rollback() {
        const blockSlot = SlotService.getSlotNumber(BlockRepository.getLastBlock().createdAt);
        const prevRound = RoundRepository.getPrevRound();
        if (!prevRound) {
            await BlockService.deleteLastBlock();
            return;
        }
        const lastSlotInRound = getLastSlotNumberInRound(prevRound);

        logger.debug(`[Controller][Sync][rollback] lastSlotInRound: ${lastSlotInRound}, blockSlot: ${blockSlot}`);

        if (lastSlotInRound >= blockSlot) {
            logger.debug(`[Controller][Sync][rollback] round rollback`);
            RoundService.backwardProcess();
        }

        await BlockService.deleteLastBlock();
        return;
    }

    async requestBlocks(lastBlock, peer): Promise<ResponseEntity<Array<Block>>> {
        return SyncRepository.requestBlocks({
            height: lastBlock.height,
            limit: config.CONSTANTS.TRANSFER.REQUEST_BLOCK_LIMIT
        }, peer);
    }

    sendBlocks(data: { height: number, limit: number }, peer, requestId): void {
        const blocks = BlockRepository.getMany(data.limit, data.height);
        SyncRepository.sendBlocks(blocks, peer, requestId);
    }

    async loadBlocks(blocks: Array<Block>): Promise<ResponseEntity<any>> {
        const errors: Array<string> = [];

        for (let block of blocks) {
            block.transactions.forEach(trs => SharedTransactionRepo.deserialize(trs));
            const receive = await BlockController.onReceiveBlock({ data: { block } });
            if (!receive.success) {
                errors.push(...receive.errors, '[Service][Sync][loadBlocks] error load blocks!');
                return new ResponseEntity({ errors });
            }
        }
        return new ResponseEntity();
    }

    checkCommonBlocks(block: { id: string, height: number }, peer, requestId): void {
        const isExist = BlockRepository.isExist(block.id);
        SyncRepository.sendCommonBlocksExist({ isExist }, peer, requestId);
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
        const peers = PeerRepository.peerList()
            .filter(peer => !PeerRepository.isBanned(peer));

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
        const peers = PeerRepository.peerList()
            .filter(peer => !PeerRepository.isBanned(peer));

        const commonPeers = peers.filter(peer => {
            return peer.broadhash === SystemRepository.broadhash;
        });
        if (!peers.length) {
            return 0;
        }
        return (commonPeers.length + 1) / (peers.length + 1) * TOTAL_PERCENTAGE;
    }

    getMyConsensus(): boolean {
        return this.getConsensus() >= MIN_CONSENSUS;
    }

    setConsensus(value: boolean) {
        this.consensus = value;
    }
}

export default new SyncService();
