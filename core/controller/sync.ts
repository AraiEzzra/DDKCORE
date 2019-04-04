import SyncService from 'core/service/sync';
import { ON } from 'core/util/decorator';
import { Peer } from 'shared/model/peer';
import { BaseController } from 'core/controller/baseController';
import PeerService from 'core/service/peer';
import RoundService from 'core/service/round';
import { logger } from 'shared/util/logger';
import PeerRepository from 'core/repository/peer';
import { messageON } from 'shared/util/bus';
import System from 'core/repository/system';
import BlockRepository from 'core/repository/block';
import EventQueue from 'core/repository/eventQueue';
import { REQUEST_TIMEOUT } from 'core/repository/socket';

type checkCommonBlocksRequest = {
    data: {
        block: {
            id: string, height: number
        }
    },
    peer: Peer,
    requestId: string,
};

export class SyncController extends BaseController {


    @ON('REQUEST_COMMON_BLOCKS')
    checkCommonBlocks(action: checkCommonBlocksRequest): void {
        const { data, peer, requestId } = action;
        logger.debug(`[Controller][Sync][checkCommonBlocks]: ${JSON.stringify(data.block)}`);
        SyncService.checkCommonBlocks(data.block, peer, requestId);
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

        while (!SyncService.consensus) {
            const lastBlock = await BlockRepository.getLastBlock();
            if (!lastBlock) {
                logger.error(`[Controller][Sync][startSyncBlocks] lastBlock undefined`);
                break;
            }
            const responseCommonBlocks = await SyncService.checkCommonBlock(lastBlock);
            if (!responseCommonBlocks.success) {
                logger.error(`[Controller][Sync][startSyncBlocks]: ${JSON.stringify(responseCommonBlocks.errors)}`);
                if (responseCommonBlocks.errors.indexOf(REQUEST_TIMEOUT) !== -1) {
                    continue;
                }
                break;
            }
            const { isExist, peer = null } = responseCommonBlocks.data;
            if (!isExist) {
                await SyncService.rollback();
                continue;
            }
            const responseBlocks = await SyncService.requestBlocks(lastBlock, peer);
            if (!responseBlocks.success) {
                if (responseCommonBlocks.errors.indexOf(REQUEST_TIMEOUT) !== -1) {
                    continue;
                }
                continue;
            }
            await SyncService.loadBlocks(responseBlocks.data);
        }
        messageON('WARM_UP_FINISHED');
        System.synchronization = false;
        EventQueue.process();
        logger.debug('[Controller][Sync][startSyncBlocks] SYNCHRONIZATION DONE SUCCESS');
    }

    @ON('REQUEST_BLOCKS')
    sendBlocks(action: { data: { height: number, limit: number }, peer: Peer, requestId: string }): void {
        const { data, peer, requestId } = action;
        SyncService.sendBlocks(data, peer, requestId);
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
