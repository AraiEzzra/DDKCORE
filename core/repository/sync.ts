import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';
import { logger } from 'shared/util/logger';
import SharedTransactionRepo from 'shared/repository/transaction';
import { PEERS_COUNT_FOR_DISCOVER } from 'core/util/const';
import { ResponseEntity } from 'shared/model/response';

interface ISyncRepo {

    requestPeers(): void;

    sendPeers(peer: Peer, queryId): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    requestCommonBlocks(blockData: { id: string, height: number }):
        Promise<ResponseEntity<{ isExist: boolean, peer: Peer }>>;

    sendCommonBlocksExist(response, peer: Peer, requestId: string): void;

    requestBlocks(data: { height: number, limit: number }, peer): Promise<ResponseEntity<Array<Block>>>;

    sendBlocks(blocks: Array<Block>, peer, requestId: string): void;

    sendHeaders(headers): void;
}

export class Sync implements ISyncRepo {

    async requestPeers(): Promise<ResponseEntity<Array<Peer>>> {
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

        const peersResponses = await Promise.all(peersPromises);
        const result = new Map();
        peersResponses.forEach((response: ResponseEntity<Array<Peer>>) => {
            if (response.success) {
                response.data.forEach(peer => {
                    result.set(`${peer.ip}:${peer.port}`, peer);
                });
            }
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
        SocketRepository.broadcastPeers(
            'TRANSACTION_RECEIVE',
            { trs: SharedTransactionRepo.serialize(trs) }
        );
    }

    async requestCommonBlocks(blockData: { id: string, height: number }):
        Promise<ResponseEntity<{ isExist: boolean, peer: Peer }>> {
        const filteredPeers = PeerRepository.getPeersByFilter(blockData.height, SystemRepository.broadhash);
        const peer = PeerRepository.getRandomPeer(filteredPeers);

        if (!peer) {
            logger.error('[Repository][Sync][requestCommonBlocks]: Peer doesn`t found');
            return;
        }

        const response = await SocketRepository.peerRPCRequest(
            'REQUEST_COMMON_BLOCKS',
            { block: blockData },
            peer
        );

        return new ResponseEntity({ data: { isExist: response.data.isExist, peer } });
    }

    sendCommonBlocksExist(response, peer, requestId): void {
        SocketRepository.peerRPCResponse('RESPONSE_COMMON_BLOCKS', response, peer, requestId);
    }

    async requestBlocks(data: { height: number, limit: number }, peer = null): Promise<ResponseEntity<Array<Block>>> {

        const filteredPeers = PeerRepository.getPeersByFilter(data.height, SystemRepository.broadhash);
        const currentPeer = peer || PeerRepository.getRandomPeer(filteredPeers);
        return await SocketRepository.peerRPCRequest('REQUEST_BLOCKS', data, currentPeer);
    }

    sendBlocks(blocks: Array<Block>, peer, requestId): void {
        const serializedBlocks: Array<Block & { transactions?: any }> = blocks.map(block => block.getCopy());
        serializedBlocks.forEach(block => {
            block.transactions = block.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        });
        SocketRepository.peerRPCResponse('RESPONSE_BLOCKS',  serializedBlocks, peer, requestId);
    }

    sendHeaders(headers) {
        SocketRepository.broadcastPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
