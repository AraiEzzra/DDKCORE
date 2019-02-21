import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import { Sync } from 'core/repository/sync';
import Socket from 'core/repository/socket';
import { Transaction } from 'shared/model/transaction';
import headers from 'core/repository/system';

export interface ISyncService {

    requestPeers(): Promise<void>;

    sendPeers(peer: Peer): Promise<void>;

    connectNewPeers(peers: Array<Peer>): Promise<void>;

    sendNewBlock(block: Block): Promise<void>;

    sendNewTransaction(trs: Transaction<any>): Promise<void>;

    requestBlocks(data: { height: number, limit: number }): Promise<void>;

    sendBlocks(data: { height: number, limit: number }, peer: Peer): Promise<void>;
}

export class SyncService implements ISyncService {

    private syncRepo: Sync;
    private socketRepo: Socket;

    constructor() {
        this.syncRepo = new Sync();
        this.socketRepo = new Socket();
    }

    async requestPeers(): Promise<void> {
        this.syncRepo.requestPeers();
    }

    async sendPeers(peer): Promise<void> {
        this.syncRepo.sendPeers(peer);
    }

    async connectNewPeers(peers: Array<Peer>): Promise<void> {
        peers.forEach(peer => this.socketRepo.connectNewPeer(peer));
    }

    // TODO call in block service
    async sendNewBlock(block: Block): Promise<void> {
        this.syncRepo.sendNewBlock(block);
    }

    // TODO call in transaction service
    async sendNewTransaction(trs: Transaction<any>): Promise<void> {
        this.syncRepo.sendNewTransaction(trs);
    }

    async requestBlocks(peer): Promise<void> {
        // TODO getMinHeight from block service
        this.syncRepo.requestBlocks({ height: 1, limit: 42 }, peer);
    }

    async sendBlocks(data: { height: number, limit: number }, peer): Promise<void> {
        // TODO get blocks from block service
        this.syncRepo.sendBlocks([], peer);
    }

    async requestCommonBlocks(): Promise<void> {
        const blockIds = []; // TODO get id from 5 last blocks from block service
        this.syncRepo.requestCommonBlocks(blockIds);
    }

    async checkCommonBlocks(blockIds: Array<number>, peer): Promise<void> {
        //  const result = await this.blockService.getBlocks(blockIds);
        let response = true; // response = result.length
        this.syncRepo.sendCommonBlocksExist(response, peer);
    }

    async updateHeaders(data: { blockIds, lastBlock }) {
        const broadhash = headers.generateBroadhash(data.blockIds);
        const height = data.lastBlock.height;
        headers.update({ broadhash, height });
        this.syncRepo.sendHeaders(headers);
    }
}

export default new SyncService();
