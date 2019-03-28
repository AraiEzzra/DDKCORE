import SyncService from 'core/service/sync';
import { ON } from 'core/util/decorator';
import { Block } from 'shared/model/block';
import { Peer } from 'shared/model/peer';
import { BaseController } from 'core/controller/baseController';
import PeerService from 'core/service/peer';
import RoundService from 'core/service/round';
import BlockService from 'core/service/block';
import { logger } from 'shared/util/logger';
import BlockController from 'core/controller/block';
import PeerRepository from 'core/repository/peer';
import SharedTransactionRepo from 'shared/repository/transaction';
import { messageON } from 'shared/util/bus';
import System from 'core/repository/system';

export class SyncController extends BaseController {

    @ON('EMIT_REQUEST_COMMON_BLOCKS')
    emitRequestCommonBlocks(blockData: { id: string, height: number }): void {
        logger.debug(`[Controller][Sync][emitRequestCommonBlocks] id: ${blockData.id} height: ${blockData.height}`);
        SyncService.requestCommonBlocks(blockData);
    }

    @ON('REQUEST_COMMON_BLOCKS')
    checkCommonBlocks(action: { data: { block: { id: string, height: number } }, peer: Peer }): void {
        const { data, peer } = action;
        logger.debug(`[Controller][Sync][checkCommonBlocks]: ${JSON.stringify(data.block)}`);
        SyncService.checkCommonBlocks(data.block, peer);
    }

    @ON('RESPONSE_COMMON_BLOCKS')
    async getCommonBlocks(action: { data: { isExist: boolean, block: { id: string, height: number } }, peer: Peer }) {
        const { data, peer } = action;
        logger.debug(`[Controller][Sync][getCommonBlocks]: ${JSON.stringify(data)}`);
        if (data.isExist) {
            SyncService.requestBlocks(data.block, peer);
        } else {
            await BlockService.deleteLastBlock();
            this.startSyncBlocks();
        }
    }

    @ON('EMIT_SYNC_BLOCKS')
    async startSyncBlocks(): Promise<void> {
        if (SyncService.consensus || PeerRepository.peerList().length === 0) {
            if (!RoundService.getIsBlockChainReady()) {
                System.synchronization = false;
                messageON('WARM_UP_FINISHED', {});
            }
            return;
        }
        System.synchronization = true;
        RoundService.setIsBlockChainReady(false);
        logger.debug(`[Controller][Sync][startSyncBlocks]: start sync with consensus ${SyncService.getConsensus()}%`);

        await SyncService.checkCommonBlock();
    }

    @ON('REQUEST_BLOCKS')
    sendBlocks(action: { data: { height: number, limit: number }, peer: Peer }): void {
        const { data, peer } = action;
        SyncService.sendBlocks(data, peer);
    }

    @ON('RESPONSE_BLOCKS')
    async loadBlocks(action: { data: { blocks: Array<Block> }, peer: Peer }): Promise<void> {
        const { data } = action;
        for (let block of data.blocks) {
            block.transactions.forEach(trs => SharedTransactionRepo.deserialize(trs));
            const receive = await BlockController.onReceiveBlock({ data: { block } });
            // TODO to fix slots with rounds and then remove checking
            if (!receive.success) {
                logger.error(`[Controller][Sync][loadBlocks] error load blocks!`);
                return;
            }
        }
        if (!SyncService.consensus) {
            await SyncService.checkCommonBlock();
        } else if (!RoundService.getIsBlockChainReady()) {
            System.synchronization = false;
            messageON('WARM_UP_FINISHED');
        }
    }

    @ON('PEER_HEADERS_UPDATE')
    updatePeer(action: { data, peer }): void {
        const { data, peer } = action;
        PeerService.update(data, peer);
    }

    @ON('LAST_BLOCKS_UPDATE')
    updateHeaders(data: { lastBlock }): void {
        logger.debug(`[Controller][Sync][updateHeaders]: id ${data.lastBlock.id}, height: ${data.lastBlock.height}`);
        SyncService.updateHeaders(data.lastBlock);
    }


}

export default new SyncController();
