import Socket from 'core/repository/socket';
import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import { PeerRepo } from 'core/repository/peer';

interface ISyncRepo {

    requestPeers(): Promise<void>;

    sendPeers(peer: Peer): Promise<void>;

    sendNewBlock(block: Block): Promise<void>;

    sendUnconfirmedTransaction(trs: Transaction<any>): Promise<void>;

    requestBlocks(data: { height: number, limit: number }, peer?): Promise<void>;

    sendBlocks(blocks: Array<Block>, peer): Promise<void>;
}

export class Sync implements ISyncRepo {
    private static _instance: Sync;
    private socketRepo: Socket;
    private peerRepo: PeerRepo;

    constructor() {
        if (Sync._instance) {
            return Sync._instance;
        }
        this.socketRepo = new Socket();
        this.peerRepo = new PeerRepo();
        Sync._instance = this;
    }

    async requestPeers(): Promise<void> {
        const peer = this.peerRepo.getRandomTrustedPeer();
        this.socketRepo.emitPeer('REQUEST_PEERS', {}, peer);
    }

    async sendPeers(peer: Peer): Promise<void> {
        const peers = this.peerRepo.peerList().map(peer => ({
                ip: peer.ip,
                port: peer.port,
            })
        );

        this.socketRepo.emitPeer('RESPONSE_PEERS', { peers }, peer);
    }

    async sendNewBlock(block: Block): Promise<void> {
        this.socketRepo.emitPeers('BLOCK_RECEIVE', { block });
    }

    async sendUnconfirmedTransaction(trs: Transaction<any>): Promise<void> {
        this.socketRepo.emitPeers('TRANSACTION_RECEIVE', { trs });
    }

    async requestCommonBlocks(blockIds) {
        // TODO minheight > нашей && !consensus (broadhash не такой как наш)

        const filteredPeers = this.peerRepo.getPeersByFilter();
        const peers = this.peerRepo.getRandomPeers(
            2,
            filteredPeers
        );
        this.socketRepo.emitPeers('REQUEST_COMMON_BLOCKS', blockIds, peers);
    }

    async sendCommonBlocksExist(data: boolean, peer): Promise<void> {
        this.socketRepo.emitPeer('RESPONSE_COMMON_BLOCKS', data, peer);
    }

    async requestBlocks(data: { height: number, limit: number }, peer): Promise<void> {
        this.socketRepo.emitPeer('REQUEST_BLOCKS', data, peer);
    }

    async sendBlocks(blocks: Array<Block>, peer): Promise<void> {
        this.socketRepo.emitPeer('RESPONSE_BLOCKS', { blocks }, peer);
    }

    async sendHeaders(headers) {
        this.socketRepo.emitPeers('PEER_HEADERS_UPDATE', headers);
    }
}
