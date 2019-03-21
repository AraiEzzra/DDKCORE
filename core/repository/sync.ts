import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';
import { logger } from 'shared/util/logger';
import TransactionRepo from 'core/repository/transaction';
import { PEERS_COUNT_FOR_DISCOVER } from 'core/util/const';
import SharedTransactionRepo from 'shared/repository/transaction';

interface ISyncRepo {

    requestPeers(): void;

    sendPeers(peer: Peer, queryId): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    requestCommonBlocks(blockData: { id: string, height: number }): void;

    sendCommonBlocksExist(response, peer: Peer): void;

    requestBlocks(data: { height: number, limit: number }, peer?): void;

    sendBlocks(blocks: Array<Block>, peer): void;

    sendHeaders(headers): void;
}

export class Sync implements ISyncRepo {

    async requestPeers(): Promise<Array<Peer>> {
        try {
            const peer = PeerRepository.getRandomTrustedPeer();
            return await SocketRepository.peerRPCRequest('REQUEST_PEERS', {}, peer);
        } catch (e) {
            logger.error(JSON.stringify(e));
        }
    }

    async discoverPeers(): Promise<Map<string, object>> {
        const randomPeers = PeerRepository.getRandomPeers(PEERS_COUNT_FOR_DISCOVER);

        const peersPromises = randomPeers.map(peer => {
            return SocketRepository.peerRPCRequest('REQUEST_PEERS', {}, peer);
        });

        const peersResponses = await Promise.all(peersPromises)
        .catch((e) => logger.error(`discover peers ${JSON.stringify(e)}`));
        const result = new Map();
        (peersResponses || []).forEach((response: Array<any>) => {
            response.forEach(peer => {
                result.set(`${peer.ip}:${peer.port}`, peer);
            });
        });
        return result;
    }

    sendPeers(peer: Peer, requestId): void {
        const peers = PeerRepository.peerList().map(item => ({
                ip: item.ip,
                port: item.port,
            })
        );

        SocketRepository.peerRPCResponse('RESPONSE_PEERS', peers, peer, requestId);
    }

    sendNewBlock(block: Block): void {
        const serializedBlock: Block & { transactions: any } = block.getCopy();
        serializedBlock.transactions = block.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        SocketRepository.broadcastPeers('BLOCK_RECEIVE', { block: serializedBlock });
    }

    sendUnconfirmedTransaction(trs: Transaction<any>): void {
        SocketRepository.broadcastPeers('TRANSACTION_RECEIVE', { trs: SharedTransactionRepo.serialize(trs) });
    }

    requestCommonBlocks(blockData: { id: string, height: number }): void {
        const filteredPeers = PeerRepository.getPeersByFilter(blockData.height, SystemRepository.broadhash);
        const peer = PeerRepository.getRandomPeer(filteredPeers);
        if (!peer) {
            logger.error('[Repository][Sync][requestCommonBlocks]: Peer doesn`t found');
            return;
        }
        SocketRepository.broadcastPeer('REQUEST_COMMON_BLOCKS', { block: blockData }, peer);
    }

    sendCommonBlocksExist(response, peer): void {
        SocketRepository.broadcastPeer('RESPONSE_COMMON_BLOCKS', response, peer);
    }

    requestBlocks(data: { height: number, limit: number }, peer = null): void {

        const filteredPeers = PeerRepository.getPeersByFilter(data.height, SystemRepository.broadhash);
        const currentPeer = peer || PeerRepository.getRandomPeer(filteredPeers);
        SocketRepository.broadcastPeer('REQUEST_BLOCKS', data, currentPeer);
    }

    sendBlocks(blocks: Array<Block>, peer): void {
        const serializedBlocks: Array<Block & { transactions?: any }> = blocks.map(block => block.getCopy());
        serializedBlocks.forEach(block => {
            block.transactions = block.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        });
        SocketRepository.broadcastPeer('RESPONSE_BLOCKS', { blocks: serializedBlocks }, peer);
    }

    sendHeaders(headers) {
        SocketRepository.broadcastPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
