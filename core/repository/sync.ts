import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';
import SystemRepository from 'core/repository/system';

interface ISyncRepo {

    requestPeers(): Promise<void>;

    sendPeers(peer: Peer): Promise<void>;

    sendNewBlock(block: Block): Promise<void>;

    sendUnconfirmedTransaction(trs: Transaction<any>): Promise<void>;

    requestBlocks(data: { height: number, limit: number }, peer?): Promise<void>;

    sendBlocks(blocks: Array<Block>, peer): Promise<void>;
}

export class Sync implements ISyncRepo {

    constructor() {
    }
    
    async requestPeers(): Promise<void> {
        const peer = PeerRepository.getRandomTrustedPeer();
        SocketRepository.emitPeer('REQUEST_PEERS', {}, peer);
    }

    async sendPeers(peer: Peer): Promise<void> {
        const peers = PeerRepository.peerList().map(peer => ({
                ip: peer.ip,
                port: peer.port,
            })
        );

        SocketRepository.emitPeer('RESPONSE_PEERS', { peers }, peer);
    }

    async sendNewBlock(block: Block): Promise<void> {
        SocketRepository.emitPeers('BLOCK_RECEIVE', { block });
    }

    async sendUnconfirmedTransaction(trs: Transaction<any>): Promise<void> {
        SocketRepository.emitPeers('TRANSACTION_RECEIVE', { trs });
    }

    async requestCommonBlocks(block) {
        const filteredPeers = PeerRepository.getPeersByFilter(block.height, SystemRepository.broadhash);
        const peer = PeerRepository.getRandomPeer(filteredPeers);
        SocketRepository.emitPeer('REQUEST_COMMON_BLOCKS', block, peer);
    }

    async sendCommonBlocksExist(response, peer): Promise<void> {
        SocketRepository.emitPeer('RESPONSE_COMMON_BLOCKS', response, peer);
    }

    async requestBlocks(data: { height: number, limit: number }, peer = null): Promise<void> {

        const filteredPeers = PeerRepository.getPeersByFilter(data.height, SystemRepository.broadhash);
        const currentPeer = peer || PeerRepository.getRandomPeer(filteredPeers);
        SocketRepository.emitPeer('REQUEST_BLOCKS', data, currentPeer);
    }

    async sendBlocks(blocks: Array<Block>, peer): Promise<void> {
        SocketRepository.emitPeer('RESPONSE_BLOCKS', { blocks }, peer);
    }

    async sendHeaders(headers) {
        SocketRepository.emitPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
