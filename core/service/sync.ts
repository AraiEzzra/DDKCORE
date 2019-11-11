import { Block, BlockModel, SerializedBlock } from 'shared/model/block';
import { IAsset, Transaction } from 'shared/model/transaction';
import SystemRepository from 'core/repository/system';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block/index';
import BlockStorageService from 'core/service/blockStorage';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import config from 'shared/config';
import RoundService from 'core/service/round';
import SlotService from 'core/service/slot';
import { ResponseEntity } from 'shared/model/response';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import PeerService, { ERROR_NOT_ENOUGH_PEERS } from 'core/service/peer';
import { ActionTypes } from 'core/util/actionTypes';
import { BlockData, BlockLimit, PeerAddress, RequestPeerInfo, ShortPeerInfo } from 'shared/model/types';
import { getRandom, getRandomElements } from 'core/util/common';
import { NetworkPeer } from 'shared/model/Peer/networkPeer';
import { MemoryPeer } from 'shared/model/Peer/memoryPeer';
import { logger } from 'shared/util/logger';
import SwapTransactionQueue from 'core/service/swapTransactionQueue';
import TransactionQueue from 'core/service/transactionQueue';
import { peerAddressToString } from 'core/util/peer';
import { SchemaName } from 'shared/util/byteSerializer/config';
import { createBufferArray, createBufferObject } from 'shared/util/byteSerializer';
import { BufferTypes } from 'shared/util/byteSerializer/types';
import { serializeAssetTransaction } from 'shared/util/transaction';
import { messageON } from 'shared/util/bus';

export interface ISyncService {

    sendPeers(requestPeerInfo: RequestPeerInfo): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    checkCommonBlock(lastBlock: BlockData): Promise<ResponseEntity<{ isExist: boolean, peer?: MemoryPeer }>>;

    requestBlocks(lastBlock: Block, peer: PeerAddress): Promise<ResponseEntity<Array<BlockModel>>>;

    sendBlocks(data: BlockLimit, requestFromPeer: RequestPeerInfo): void;

}

export const ERROR_NO_WORTHY_PEERS = 'Error no worthy peers';
const LOG_PREFIX = '[Service][Sync]';

export class SyncService implements ISyncService {

    consensus: boolean;

    async pickNewPeers(): Promise<Array<ShortPeerInfo>> {
        const fullNetworkPeerList = PeerNetworkRepository.getAll();
        const randomNetworkPeers = getRandomElements(config.CONSTANTS.PEERS_COUNT_FOR_DISCOVER, fullNetworkPeerList);
        const peersPromises = randomNetworkPeers.map((peer: NetworkPeer) => {
            return peer.requestRPC(ActionTypes.REQUEST_PEERS, createBufferObject({}, SchemaName.Empty));
        });

        const peersResponses = await Promise.all(peersPromises);
        const pickedPeers = new Map();
        peersResponses.forEach((response: ResponseEntity<Array<ShortPeerInfo>>) => {
            if (response.success) {
                response.data.forEach(peer => {
                    pickedPeers.set(peerAddressToString(peer), peer);
                });
            }
        });

        return [...pickedPeers.values()];
    }


    sendPeers(requestPeerInfo: RequestPeerInfo): void {
        if (!PeerNetworkRepository.has(requestPeerInfo.peerAddress)) {
            logger.error(`${LOG_PREFIX}[sendPeers] peer is offline for response` +
                ` ${requestPeerInfo.peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(requestPeerInfo.peerAddress);
        const peerAddresses = PeerMemoryRepository.getPeerAddresses();

        const data = createBufferArray(
            peerAddresses,
            new BufferTypes.Object(SchemaName.ShortPeerInfo)
        );
        networkPeer.responseRPC(ActionTypes.RESPONSE_PEERS, data, requestPeerInfo.requestId);
    }

    sendNewBlock(block: Block): void {
        logger.trace(`[Service][Sync][sendNewBlock] height: ${block.height} relay: ${block.relay}`);

        if (block.relay >= config.CONSTANTS.TRANSFER.MAX_BLOCK_RELAY) {
            return;
        }

        block.relay += 1;

        const filteredPeerAddresses = PeerMemoryRepository
            .getLessPeersByFilter(block.height, block.id)
            .map((memoryPeer: MemoryPeer) => memoryPeer.peerAddress);
        PeerService.broadcast(ActionTypes.BLOCK_RECEIVE, block.byteSerialize(), filteredPeerAddresses);

    }

    sendUnconfirmedTransaction(trs: Transaction<IAsset>): void {
        if (trs.relay >= config.CONSTANTS.TRANSFER.MAX_TRS_RELAY) {
            return;
        }

        trs.relay += 1;

        const byteAssetTransaction = serializeAssetTransaction(trs);
        const byteTransaction = createBufferObject(byteAssetTransaction, SchemaName.OldTransaction);

        if (PeerNetworkRepository.count === 0) {
            SwapTransactionQueue.push(byteTransaction);
            return;
        }

        PeerService.broadcast(
            ActionTypes.TRANSACTION_RECEIVE,
            byteTransaction
        );

    }

    async checkCommonBlock(lastBlock: BlockData):
        Promise<ResponseEntity<{ isExist: boolean, peerAddress?: PeerAddress }>> {

        const errors: Array<string> = [];
        const filteredMemoryPeers = PeerMemoryRepository.getHigherPeersByFilter(lastBlock.height, lastBlock.id);

        if (!filteredMemoryPeers.length) {

            if (!PeerNetworkRepository.count) {
                errors.push(`${LOG_PREFIX}[checkCommonBlock] No one peer`);
                messageON(ActionTypes.PEER_CONNECT_RUN);
            } else if (!PeerNetworkRepository.unbanCount) {
                errors.push(`${LOG_PREFIX}[checkCommonBlock] All peers are banned`);
                messageON(ActionTypes.EMIT_REBOOT_PEERS_CONNECTIONS);
            } else {
                errors.push(ERROR_NO_WORTHY_PEERS);
            }

            return new ResponseEntity({ errors });
        }
        const randomMemoryPeer = getRandom(filteredMemoryPeers);

        if (this.checkBlockConsensus(lastBlock) || lastBlock.height === 1) {

            return new ResponseEntity({
                data: {
                    isExist: true,
                    peerAddress: randomMemoryPeer.peerAddress
                }
            });

        } else {

            if (randomMemoryPeer.minHeight > lastBlock.height) {
                if (!PeerNetworkRepository.has(randomMemoryPeer.peerAddress)) {
                    errors.push(`Peer ${randomMemoryPeer.peerAddress.ip} is offline`);
                    return new ResponseEntity({ errors });
                }
                const networkPeer = PeerNetworkRepository.get(randomMemoryPeer.peerAddress);
                const response = await networkPeer.requestRPC<{ isExist: boolean }>(
                    ActionTypes.REQUEST_COMMON_BLOCKS,
                    createBufferObject(lastBlock, SchemaName.BlockData)
                );

                if (!response.success) {
                    errors.push(`response from peer not success`);
                    errors.push(...response.errors);
                    return new ResponseEntity({ errors });
                }
                return new ResponseEntity({
                    data: {
                        peerAddress: networkPeer.peerAddress,
                        isExist: response.data.isExist
                    }
                });
            }
        }
        return new ResponseEntity({ data: { isExist: false } });
    }

    async rollback() {
        const deleteResponse = await BlockService.deleteLastBlock();
        if (!deleteResponse.success) {
            return deleteResponse;
        }

        const newLastBlock = BlockRepository.getLastBlock();
        if (newLastBlock.height !== 1) {
            RoundService.restoreToSlot(SlotService.getSlotNumber(newLastBlock.createdAt));
        }
        return new ResponseEntity();
    }

    async requestBlocks(lastBlock, peerAddress): Promise<ResponseEntity<Array<BlockModel>>> {
        if (!PeerNetworkRepository.has(peerAddress)) {
            return new ResponseEntity({ errors: [] });
        }
        const networkPeer = PeerNetworkRepository.get(peerAddress);
        return await networkPeer.requestRPC(ActionTypes.REQUEST_BLOCKS, createBufferObject({
                height: lastBlock.height,
                limit: config.CONSTANTS.TRANSFER.REQUEST_BLOCK_LIMIT
            }, SchemaName.RequestBlocks)
        );
    }

    async sendBlocks(data: BlockLimit, requestPeerInfo: RequestPeerInfo): Promise<void> {
        const { peerAddress, requestId } = requestPeerInfo;
        const blocksResponse = await BlockStorageService.getMany(data.limit, data.height);
        let blocksCopy = [];

        if (blocksResponse.success) {
            blocksCopy = blocksResponse.data.map(block => block.getCopy());

            blocksCopy.forEach(block => {
                block.transactions = block.transactions.map(trs => serializeAssetTransaction(trs));
                block.transactions = createBufferArray(
                    block.transactions,
                    new BufferTypes.Object(SchemaName.OldTransactionBlock)
                );
            });
        } else {
            logger.error(`[Service][Sync][sendBlocks]: ${blocksResponse.errors.join(', ')}`);
        }

        if (!PeerNetworkRepository.has(peerAddress)) {
            logger.trace(`[Service][Sync][sendBlocks] peer is offline for response ${peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(peerAddress);
        const byteArrayBlock = createBufferArray(blocksCopy, new BufferTypes.Object(SchemaName.Block));
        networkPeer.responseRPC(ActionTypes.RESPONSE_BLOCKS, byteArrayBlock, requestId);
    }

    async saveRequestedBlocks(blocks: Array<BlockModel>): Promise<ResponseEntity<void>> {
        const errors = [];
        for (const block of blocks) {
            const receivedBlock = new Block(block);
            const lastBlock = BlockRepository.getLastBlock();
            const validateReceivedBlockResponse = BlockService.validateReceivedBlock(lastBlock, receivedBlock);

            if (!validateReceivedBlockResponse.success) {
                errors.push(
                    `[Service][Sync][onSaveNewBlock] Received block not valid:` +
                    `${validateReceivedBlockResponse.errors}`,
                );
                break;
            }

            RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));

            TransactionQueue.lock();

            const receivedBlockResponse = await BlockService.receiveBlock(receivedBlock);

            TransactionQueue.unlock();

            if (!receivedBlockResponse.success) {
                errors.push(
                    ...receivedBlockResponse.errors,
                    `[Service][Sync][saveRequestedBlocks] error save requested block with id: ${receivedBlock.id}`,
                );
                break;
            }
        }

        return new ResponseEntity({ errors });
    }

    checkCommonBlocks(block: BlockData, requestPeerInfo: RequestPeerInfo): void {
        const isExist = BlockStorageService.has(block.id);
        logger.trace(`[Service][Sync][checkCommonBlocks] block: ${block.height} exist: ${isExist}`);
        if (!PeerNetworkRepository.has(requestPeerInfo.peerAddress)) {
            logger.debug(`[Service][Sync][checkCommonBlocks] peer is offline for response ` +
                `${requestPeerInfo.peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(requestPeerInfo.peerAddress);
        networkPeer.responseRPC(
            ActionTypes.RESPONSE_COMMON_BLOCKS,
            createBufferObject({ isExist }, SchemaName.CommonBlockResponse),
            requestPeerInfo.requestId
        );
    }

    updateHeaders(lastBlock: Block) {
        SystemRepository.update({
            broadhash: lastBlock.id,
            height: lastBlock.height,
        });
        SystemRepository.addBlockIdInPool(lastBlock);
        logger.trace(`[Service][Sync][updateHeaders]: height ${lastBlock.height}, broadhash ${lastBlock.id}`);
        PeerService.broadcast(
            ActionTypes.PEER_HEADERS_UPDATE,
            createBufferObject(SystemRepository.getHeaders(), SchemaName.Headers)
        );
    }

    getBlockConsensus(block: BlockData): number {
        const peers = PeerMemoryRepository.getAll()
            .filter((peer: MemoryPeer) => !PeerNetworkRepository.isBanned(peer.peerAddress));

        const commonPeers = peers.filter((peer: MemoryPeer) => peer.blockExist(block));
        if (!peers.length) {
            return 0;
        }
        return (commonPeers.length + 1) / (peers.length + 1) * TOTAL_PERCENTAGE;
    }

    checkBlockConsensus(block: BlockData): boolean {
        return this.getBlockConsensus(block) >= config.CORE.MIN_CONSENSUS;
    }

    getConsensus(): number {
        const peers = PeerMemoryRepository.getAll()
            .filter((peer: MemoryPeer) => !PeerNetworkRepository.isBanned(peer.peerAddress));

        const commonPeers = peers.filter(peer => {
            return peer.headers.broadhash === SystemRepository.headers.broadhash &&
                peer.headers.height === SystemRepository.headers.height;
        });
        if (!peers.length) {
            return 0;
        }
        return (commonPeers.length + 1) / (peers.length + 1) * TOTAL_PERCENTAGE;
    }

    getMyConsensus(): boolean {
        return this.getConsensus() >= config.CORE.MIN_CONSENSUS;
    }

    setConsensus(value: boolean) {
        this.consensus = value;
    }
}

export default new SyncService();
