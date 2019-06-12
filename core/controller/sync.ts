import SyncService from 'core/service/sync';
import { ON, MAIN } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import PeerService from 'core/service/peer';
import { logger } from 'shared/util/logger';
import { messageON } from 'shared/util/bus';
import System from 'core/repository/system';
import BlockRepository from 'core/repository/block';
import EventQueue from 'core/repository/eventQueue';
import { asyncTimeout } from 'shared/util/timer';
import RoundService from 'core/service/round';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import { BlockData, BlockLimit, PeerAddress, RequestPeerInfo } from 'shared/model/types';
import { REQUEST_TIMEOUT } from 'core/driver/socket';
import { ActionTypes } from 'core/util/actionTypes';
import { Headers } from 'shared/model/Peer/headers';
import SlotService from 'core/service/slot';
import { ResponseEntity } from 'shared/model/response';

type CheckCommonBlocksRequest = {
    data: BlockData,
    requestPeerInfo: RequestPeerInfo
};

type PeerUpdateHeaders = {
    data: Headers,
    peerAddress: PeerAddress
};
type BlocksRequest = {
    data: BlockLimit,
    requestPeerInfo: RequestPeerInfo
};

const SYNC_TIMEOUT = 10000;
const LOG_PREFIX = '[Controller][Sync]';
let lastSyncTime: number = 0;

export class SyncController extends BaseController {

    @ON(ActionTypes.REQUEST_COMMON_BLOCKS)
    checkCommonBlocks({ data, requestPeerInfo }: CheckCommonBlocksRequest): void {
        logger.debug(`${LOG_PREFIX}[checkCommonBlocks]: ${JSON.stringify(data)}, ` +
            `peer: ${requestPeerInfo.peerAddress.ip}`);
        SyncService.checkCommonBlocks(data, requestPeerInfo);
    }

    @MAIN(ActionTypes.EMIT_SYNC_BLOCKS)
    async startSyncBlocks(): Promise<ResponseEntity<void>> {
        let lastPeerRequested = null;
        const currentTime = new Date().getTime();
        const syncTimeDiff = currentTime - lastSyncTime;
        if (lastSyncTime && syncTimeDiff < SYNC_TIMEOUT) {
            logger.info(`Wait ${syncTimeDiff} ms for next sync`);
            await asyncTimeout(syncTimeDiff);
        }
        lastSyncTime = currentTime;

        if (SyncService.getMyConsensus() || !PeerNetworkRepository.count) {
            System.synchronization = false;
            messageON('WARM_UP_FINISHED');

            const logMessage = `${LOG_PREFIX}[startSyncBlocks]: Unable to sync`;
            if (SyncService.getMyConsensus()) {
                logger.info(`${logMessage}. Consensus is ${SyncService.getConsensus()}%`);
            } else if (!PeerNetworkRepository.count) {
                logger.info(`${logMessage}. No peers to sync`);
            }
            return;
        }

        System.synchronization = true;
        logger.debug(`${LOG_PREFIX}[startSyncBlocks]: start sync with consensus ${SyncService.getConsensus()}%`);
        const lastBlockSlotNumber = SlotService.getSlotNumber(BlockRepository.getLastBlock().createdAt);
        RoundService.restoreToSlot(lastBlockSlotNumber);

        // TODO: change sync timeout logic
        let needDelay = false;
        while (!SyncService.getMyConsensus()) {
            if (!needDelay) {
                needDelay = true;
            } else {
                logger.info(`Sync starts after ${SYNC_TIMEOUT} ms`);
                await asyncTimeout(SYNC_TIMEOUT);
            }

            const lastBlock = await BlockRepository.getLastBlock();
            if (!lastBlock) {
                logger.error(`${LOG_PREFIX}[startSyncBlocks] lastBlock is undefined`);
                break;
            }

            const responseCommonBlocks = await SyncService.checkCommonBlock({
                id: lastBlock.id,
                height: lastBlock.height,
            });

            if (!responseCommonBlocks.success) {
                logger.error(
                    `${LOG_PREFIX}[startSyncBlocks][responseCommonBlocks]: ` +
                    responseCommonBlocks.errors.join('. ')
                );
                if (responseCommonBlocks.errors.indexOf(REQUEST_TIMEOUT) !== -1) {
                    continue;
                }
                break;
            }
            const { isExist, peerAddress = null } = responseCommonBlocks.data;
            if (!isExist) {
                if (lastPeerRequested) {
                    PeerNetworkRepository.ban(lastPeerRequested);
                    lastPeerRequested = null;
                }
                const status = await SyncService.rollback();
                if (!status.success) {
                    logger.error(
                        `${LOG_PREFIX}[startSyncBlocks][rollback]: ${status.errors.join('. ')}`
                    );
                }
                needDelay = false;
                continue;
            }
            lastPeerRequested = peerAddress;
            const responseBlocks = await SyncService.requestBlocks(lastBlock, peerAddress);
            if (!responseBlocks.success) {
                logger.error(
                    `${LOG_PREFIX}[startSyncBlocks][responseBlocks]: ${responseBlocks.errors.join('. ')}`
                );
                continue;
            }
            const saveRequestedBlocksResponse = await SyncService.saveRequestedBlocks(responseBlocks.data);
            if (!saveRequestedBlocksResponse.success) {
                logger.error(
                    `${LOG_PREFIX}[startSyncBlocks][loadStatus]: ${saveRequestedBlocksResponse.errors.join('. ')}`
                );
            } else {
                needDelay = false;
            }
        }
        System.synchronization = false;
        const currentSlotNumber = SlotService.getSlotNumber(SlotService.getTime(Date.now()));
        RoundService.restoreToSlot(currentSlotNumber);
        messageON('WARM_UP_FINISHED');
        EventQueue.process();
        logger.info(`${LOG_PREFIX}[startSyncBlocks] SYNCHRONIZATION DONE SUCCESS`);

        return new ResponseEntity();
    }

    @ON(ActionTypes.REQUEST_BLOCKS)
    sendBlocks({ data, requestPeerInfo }: BlocksRequest): void {
        SyncService.sendBlocks(data, requestPeerInfo);
    }

    @ON(ActionTypes.PEER_HEADERS_UPDATE)
    updatePeer({ data, peerAddress }: PeerUpdateHeaders): void {
        logger.debug(`${LOG_PREFIX}[updatePeer][${peerAddress.ip}:${peerAddress.port}] ` +
            `broadhash ${data.broadhash}, height: ${data.height}`);
        PeerService.update(peerAddress, data);
    }

    @ON(ActionTypes.LAST_BLOCKS_UPDATE)
    updateHeaders(data: { lastBlock }): void {
        logger.debug(`${LOG_PREFIX}[updateHeaders]: broadhash ${data.lastBlock.id}, height: ${data.lastBlock.height}`);
        SyncService.updateHeaders(data.lastBlock);
    }
}

export default new SyncController();
