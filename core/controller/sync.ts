import { SyncService } from 'core/service/sync';
import { RPC, ON } from 'core/util/decorator';
import { Block } from 'shared/model/block';
import { Transaction } from 'shared/model/transaction';
import { Peer } from 'shared/model/peer';

export class SyncController {
    private syncService: SyncService;

    constructor() {
        this.syncService = new SyncService();
    }

    @ON('NEW_BLOCK')
    async newBlock(data: { block: Block }): Promise<void> {
        // TODO call block_service
    }

    @ON('NEW_TRANSACTION')
    async newTransaction(data: { trs: Transaction<any> }): Promise<void> {
        //    TODO call transaction service
    }

    @ON('NEW_UNCONFIRMED_TRANSACTION')
    async newUnconfirmedTransaction(data: { trs: Transaction<any> }): Promise<void> {
    }

    @RPC('GET_COMMON_BLOCK')
    async getCommonBlock(ids, peer): Promise<void> {
    }

    // TODO call after several minutes or by interval
    @ON('EMIT_REQUEST_PEERS')
    async requestPeers(): Promise<void> {
        this.syncService.requestPeers();
    }

    @ON('REQUEST_PEERS')
    async sendPeers(peer: Peer): Promise<void> {
        this.syncService.sendPeers(peer);
    }

    @ON('RESPONSE_PEERS')
    async connectNewPeers(data: { peers }): Promise<void> {
        this.syncService.connectNewPeers(data.peers);
    }

     // TODO call after several minutes or by interval
    @ON('EMIT_REQUEST_COMMON_BLOCKS')
    async emitRequestCommonBlocks() {
        this.syncService.requestCommonBlocks();
    }

    @ON('REQUEST_COMMON_BLOCKS')
    async checkCommonBlocks(blockIds: Array<number>, peer: Peer) {
        this.syncService.checkCommonBlocks(blockIds, peer);
    }

    @ON('RESPONSE_COMMON_BLOCKS')
    async getCommonBlocks(result: boolean, peer: Peer) {
        if (result) {
            this.requestBlocks(peer);
        }
    }

    @ON('EMIT_REQUEST_BLOCKS')
    async requestBlocks(peer: Peer): Promise<void> {
        this.syncService.requestBlocks(peer);
    }

    @ON('REQUEST_BLOCKS')
    async sendBlocks(data: { height: number, limit: number }, peer): Promise<void> {
        this.syncService.sendBlocks(data, peer);
    }

    @ON('RESPONSE_BLOCKS')
    async getBlocks(data: { blocks: Array<Block> }, peer): Promise<void> {
        //    TODO call block service and insert blocks
    }


}

export default new SyncController();
