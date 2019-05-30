import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';
import SharedTransactionRepo from 'shared/repository/transaction';
import config from 'shared/config';
import { ResponseEntity } from 'shared/model/response';
import SwapTransactionQueue from 'core/repository/swapTransactiontQueue';

export const ERROR_NOT_ENOUGH_PEERS = 'ERROR_NOT_ENOUGH_PEERS';

interface ISyncRepo {

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

    async discoverPeers(): Promise<Map<string, object>> {
        const randomPeers = PeerRepository.getRandomPeers(config.CONSTANTS.PEERS_COUNT_FOR_DISCOVER);

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
                peerCount: item.peerCount
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
        const serializedTransaction = SharedTransactionRepo.serialize(trs);
        if (PeerRepository.peerList().length === 0) {
            SwapTransactionQueue.push(serializedTransaction);
            return;
        }
        if (SwapTransactionQueue.size && PeerRepository.peerList().length) {
            SwapTransactionQueue.process();
        }
        SocketRepository.broadcastPeers(
            'TRANSACTION_RECEIVE',
            { trs: serializedTransaction }
        );
    }

    async requestCommonBlocks(blockData: { id: string, height: number }):
        Promise<ResponseEntity<{ isExist: boolean, peer: Peer }>> {
        const filteredPeers = PeerRepository.getPeersByFilter(blockData.height, SystemRepository.broadhash);
        const peer = PeerRepository.getRandomPeer(filteredPeers);

        if (!peer) {
            return new ResponseEntity(
                { errors: [ERROR_NOT_ENOUGH_PEERS] }
            );
        }

        const response = await SocketRepository.peerRPCRequest(
            'REQUEST_COMMON_BLOCKS',
            { block: blockData },
            peer
        );

        if (!response.success) {
            return new ResponseEntity(
                { errors: response.errors }
            );
        }
        return new ResponseEntity({ data: { isExist: response.data.isExist, peer } });
    }

    sendCommonBlocksExist(response, peer, requestId): void {
        SocketRepository.peerRPCResponse('RESPONSE_COMMON_BLOCKS', response, peer, requestId);
    }

    async requestBlocks(data: { height: number, limit: number }, peer = null): Promise<ResponseEntity<Array<Block>>> {

        if (peer === null) {
            const filteredPeers = PeerRepository.getPeersByFilter(data.height, SystemRepository.broadhash);
            if (!filteredPeers.length) {
                return new ResponseEntity({ errors: [ERROR_NOT_ENOUGH_PEERS] });
            }
            peer = PeerRepository.getRandomPeer(filteredPeers);
        }

        return SocketRepository.peerRPCRequest('REQUEST_BLOCKS', data, peer);
    }

    sendBlocks(blocks: Array<Block>, peer, requestId): void {
        const serializedBlocks: Array<Block & { transactions?: any }> = blocks.map(block => block.getCopy());
        serializedBlocks.forEach(block => {
            block.transactions = block.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        });
        SocketRepository.peerRPCResponse('RESPONSE_BLOCKS', serializedBlocks, peer, requestId);
    }

    sendHeaders(headers) {
        SocketRepository.broadcastPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
