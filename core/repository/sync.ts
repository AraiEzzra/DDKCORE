import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';
import { logger } from 'shared/util/logger';

interface ISyncRepo {

    requestPeers(): void;

    sendPeers(peer: Peer): void;

    sendNewBlock(block: Block): void;

    sendUnconfirmedTransaction(trs: Transaction<any>): void;

    requestCommonBlocks(block: { id: string, height: number }): void;

    sendCommonBlocksExist(response, peer: Peer): void;

    requestBlocks(data: { height: number, limit: number }, peer?): void;

    sendBlocks(blocks: Array<Block>, peer): void;

    sendHeaders(headers): void;
}

export class Sync implements ISyncRepo {

    constructor() {
    }

    requestPeers(): void {
        const peer = PeerRepository.getRandomTrustedPeer();
        SocketRepository.emitPeer('REQUEST_PEERS', {}, peer);
    }

    sendPeers(peer: Peer): void {
        const peers = PeerRepository.peerList().map(item => ({
                ip: item.ip,
                port: item.port,
            })
        );

        SocketRepository.emitPeer('RESPONSE_PEERS', { peers }, peer);
    }

    sendNewBlock(block: Block): void {
        SocketRepository.emitPeers('BLOCK_RECEIVE', { block });
    }

    sendUnconfirmedTransaction(trs: Transaction<any>): void {
        SocketRepository.emitPeers('TRANSACTION_RECEIVE', { trs });
    }

    requestCommonBlocks(block): void {
        const filteredPeers = PeerRepository.getPeersByFilter(block.height, SystemRepository.broadhash);
        const peer = PeerRepository.getRandomPeer(filteredPeers);
        if (!peer) {
            logger.error('[Repository][Sync][requestCommonBlocks]: Peer doesn`t found');
            return;
        }
        SocketRepository.emitPeer('REQUEST_COMMON_BLOCKS', { block }, peer);
    }

    sendCommonBlocksExist(response, peer): void {
        SocketRepository.emitPeer('RESPONSE_COMMON_BLOCKS', response, peer);
    }

    requestBlocks(data: { height: number, limit: number }, peer = null): void {

        const filteredPeers = PeerRepository.getPeersByFilter(data.height, SystemRepository.broadhash);
        const currentPeer = peer || PeerRepository.getRandomPeer(filteredPeers);
        SocketRepository.emitPeer('REQUEST_BLOCKS', data, currentPeer);
    }

    sendBlocks(blocks: Array<Block>, peer): void {
        SocketRepository.emitPeer('RESPONSE_BLOCKS', { blocks }, peer);
    }

    sendHeaders(headers) {
        SocketRepository.emitPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
