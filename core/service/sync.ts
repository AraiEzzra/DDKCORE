import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import SystemRepository from 'core/repository/system';
import BlockService from 'core/service/block';
import BlockRepository from 'core/repository/block/index';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import config from 'shared/config';
import RoundService from 'core/service/round';
import SlotService from 'core/service/slot';
import { ResponseEntity } from 'shared/model/response';
import SharedTransactionRepository from 'shared/repository/transaction';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import PeerService, { ERROR_NOT_ENOUGH_PEERS } from 'core/service/peer';
import { ActionTypes } from 'core/util/actionTypes';
import { BlockData, BlockLimit, PeerAddress, RequestPeerInfo } from 'shared/model/types';
import { getRandom, getRandomElements } from 'core/util/common';
import { NetworkPeer } from 'shared/model/Peer/networkPeer';
import { MemoryPeer } from 'shared/model/Peer/memoryPeer';
import { logger } from 'shared/util/logger';

export interface ISyncService {

    sendPeers(requestPeerInfo: RequestPeerInfo): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    checkCommonBlock(lastBlock: BlockData): Promise<ResponseEntity<{ isExist: boolean, peer?: MemoryPeer }>>;

    requestBlocks(lastBlock: Block, peer: PeerAddress): Promise<ResponseEntity<Array<Block>>>;

    sendBlocks(data: BlockLimit, requestFromPeer: RequestPeerInfo): void;

}

export class SyncService implements ISyncService {

    consensus: boolean;

    async discoverPeers(): Promise<Array<PeerAddress & { peerCount: number }>> {
        const fullNetworkPeerList = PeerNetworkRepository.getAll();
        const randomNetworkPeers = getRandomElements(config.CONSTANTS.PEERS_COUNT_FOR_DISCOVER, fullNetworkPeerList);
        const peersPromises = randomNetworkPeers.map((peer: NetworkPeer) => {
            return peer.requestRPC(ActionTypes.REQUEST_PEERS, {});
        });

        const peersResponses = await Promise.all(peersPromises);
        const result = new Map();
        peersResponses.forEach((response: ResponseEntity<Array<PeerAddress & { peerCount: number }>>) => {
            if (response.success) {
                response.data.forEach(peer => {
                    result.set(`${peer.ip}:${peer.port}`, peer);
                });
            }
        });
        return [...result.values()];
    }

    sendPeers(requestPeerInfo: RequestPeerInfo): void {
        if (!PeerNetworkRepository.has(requestPeerInfo.peerAddress)) {
            logger.trace(`[Service][Sync][sendPeers] peer is offline for response` +
                ` ${requestPeerInfo.peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(requestPeerInfo.peerAddress);
        const peerAddresses = PeerMemoryRepository.getPeerAddresses();
        networkPeer.responseRPC(ActionTypes.RESPONSE_PEERS, peerAddresses, requestPeerInfo.requestId);
    }

    sendNewBlock(block: Block): void {

        logger.trace(`[Service][Sync][sendNewBlock] height: ${block.height} relay: ${block.relay}`);
        block.relay += 1;
        if (block.relay < config.CONSTANTS.TRANSFER.MAX_BLOCK_RELAY) {
            const serializedBlock: Block & { transactions: any } = block.getCopy();
            serializedBlock.transactions = block.transactions.map(trs => SharedTransactionRepository.serialize(trs));

            const filteredPeerAddresses = PeerMemoryRepository
                .getLessPeersByFilter(block.height, block.id)
                .map((memoryPeer: MemoryPeer) => memoryPeer.peerAddress);

            PeerService.broadcast(ActionTypes.BLOCK_RECEIVE, { block: serializedBlock }, filteredPeerAddresses);
        }
    }

    sendUnconfirmedTransaction(trs: Transaction<any>): void {
        trs.relay += 1;
        if (trs.relay < config.CONSTANTS.TRANSFER.MAX_TRS_RELAY) {
            PeerService.broadcast(
                ActionTypes.TRANSACTION_RECEIVE,
                { trs: SharedTransactionRepository.serialize(trs) }
            );
        }
    }

    async checkCommonBlock(lastBlock: BlockData):
        Promise<ResponseEntity<{ isExist: boolean, peerAddress?: PeerAddress }>> {

        const errors: Array<string> = [];
        const filteredMemoryPeers = PeerMemoryRepository.getHigherPeersByFilter(lastBlock.height, lastBlock.id);

        if (!filteredMemoryPeers.length) {
            return new ResponseEntity({ errors: [ERROR_NOT_ENOUGH_PEERS] });
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
                    lastBlock
                );

                if (!response.success) {
                    errors.push(`response from peer not success`);
                    errors.push(...response.errors);
                    return new ResponseEntity({ errors });
                }
                const { isExist } = response.data;
                if (isExist) {
                    return new ResponseEntity({ data: { peerAddress: networkPeer.peerAddress, isExist } });
                }
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
        RoundService.restoreToSlot(SlotService.getSlotNumber(newLastBlock.createdAt));
        return new ResponseEntity();
    }

    async requestBlocks(lastBlock, peerAddress): Promise<ResponseEntity<Array<Block>>> {
        if (!PeerNetworkRepository.has(peerAddress)) {
            return new ResponseEntity({ errors: [] });
        }
        const networkPeer = PeerNetworkRepository.get(peerAddress);
        return await networkPeer.requestRPC(ActionTypes.REQUEST_BLOCKS, {
            height: lastBlock.height,
            limit: config.CONSTANTS.TRANSFER.REQUEST_BLOCK_LIMIT
        });
    }

    sendBlocks(data: BlockLimit, requestPeerInfo: RequestPeerInfo): void {

        const { peerAddress, requestId } = requestPeerInfo;
        const blocks = BlockRepository.getMany(data.limit, data.height);
        const serializedBlocks: Array<Block & { transactions?: any }> = blocks.map(block => block.getCopy());
        serializedBlocks.forEach(block => {
            block.transactions = block.transactions.map(trs => SharedTransactionRepository.serialize(trs));
        });
        if (!PeerNetworkRepository.has(peerAddress)) {
            logger.debug(`[Service][Sync][sendBlocks] peer is offline for response ${peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(peerAddress);
        networkPeer.responseRPC(ActionTypes.RESPONSE_BLOCKS, serializedBlocks, requestId);
    }

    async saveRequestedBlocks(blocks: Array<Block>): Promise<ResponseEntity<void>> {
        for (const receivedBlock of blocks) {

            RoundService.restoreToSlot(SlotService.getSlotNumber(receivedBlock.createdAt));
            const receivedBlockResponse = await BlockService.receiveBlock(receivedBlock);

            if (!receivedBlockResponse.success) {
                return new ResponseEntity({
                    errors: [
                        ...receivedBlockResponse.errors,
                        `[Service][Sync][saveRequestedBlocks] error save requested block with id: ${receivedBlock.id}`,
                    ]
                });
            }
        }
        return new ResponseEntity();
    }

    checkCommonBlocks(block: BlockData, requestPeerInfo: RequestPeerInfo): void {
        const isExist = BlockRepository.has(block.id);
        logger.trace(`[Service][Sync][checkCommonBlocks] block: ${block.height} exist: ${isExist}`);
        if (!PeerNetworkRepository.has(requestPeerInfo.peerAddress)) {
            logger.debug(`[Service][Sync][checkCommonBlocks] peer is offline for response ` +
                `${requestPeerInfo.peerAddress.ip}`);
            return;
        }
        const networkPeer = PeerNetworkRepository.get(requestPeerInfo.peerAddress);
        networkPeer.responseRPC(ActionTypes.RESPONSE_COMMON_BLOCKS, { isExist }, requestPeerInfo.requestId);
    }

    updateHeaders(lastBlock: Block) {
        SystemRepository.update({
            broadhash: lastBlock.id,
            height: lastBlock.height,
        });
        SystemRepository.addBlockIdInPool(lastBlock);
        logger.debug(`[Service][Sync][updateHeaders]: height ${lastBlock.height}, broadhash ${lastBlock.id}`);
        PeerService.broadcast(
            ActionTypes.PEER_HEADERS_UPDATE,
            SystemRepository.getHeaders()
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
