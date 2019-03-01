import SocketRepository from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import PeerRepository from 'core/repository/peer';

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

    // TODO remove
    async requestCommonBlocks(block) {
        // TODO minheight > нашей && !consensus (broadhash не такой как наш)

        // const filteredPeers = PeerRepository.getPeersByFilter();
        // const peer = PeerRepository.getRandomPeer(filteredPeers);
        // SocketRepository.emitPeer('REQUEST_COMMON_BLOCKS', block, peer);
    }

    // TODO remove
    async sendCommonBlocksExist(response, peer): Promise<void> {
        SocketRepository.emitPeer('RESPONSE_COMMON_BLOCKS', response, peer);
    }

    async requestBlocks(data: { height: number, limit: number }): Promise<void> {

        const filteredPeers = PeerRepository.getPeersByFilter(data.height);
        const peer = PeerRepository.getRandomPeer(filteredPeers);
        SocketRepository.emitPeer('REQUEST_BLOCKS', data, peer);
    }

    async sendBlocks(blocks: Array<Block>, peer): Promise<void> {
        SocketRepository.emitPeer('RESPONSE_BLOCKS', { blocks }, peer);
    }

    async sendHeaders(headers) {
        SocketRepository.emitPeers('PEER_HEADERS_UPDATE', headers);
    }
}

export default new Sync();
