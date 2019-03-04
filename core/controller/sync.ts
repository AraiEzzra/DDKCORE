import SyncService from 'core/service/sync';
import { ON } from 'core/util/decorator';
import { Block } from 'shared/model/block';
import { Peer } from 'shared/model/peer';
import { BaseController } from 'core/controller/baseController';
import PeerService from 'core/service/peer';
import BlockService from 'core/service/block';

export class SyncController extends BaseController {

    // TODO call after several minutes or by interval
    @ON('EMIT_REQUEST_PEERS')
    async requestPeers(): Promise<void> {
        SyncService.requestPeers();
    }

    @ON('REQUEST_PEERS')
    async sendPeers(action: { peer: Peer }): Promise<void> {
        const { peer } = action;
        SyncService.sendPeers(peer);
    }

    @ON('RESPONSE_PEERS')
    async connectNewPeers(action: { data: { peers } }): Promise<void> {
        const { data } = action;
        SyncService.connectNewPeers(data.peers);
    }

    // TODO remove
    @ON('EMIT_REQUEST_COMMON_BLOCKS')
    async emitRequestCommonBlocks() {
        SyncService.requestCommonBlocks();
    }

    // TODO remove
    @ON('REQUEST_COMMON_BLOCKS')
    async checkCommonBlocks(action: { data: { block: Block }, peer: Peer }) {
        const { data, peer } = action;
        SyncService.checkCommonBlocks(data.block, peer);
    }

    // TODO remove
    @ON('RESPONSE_COMMON_BLOCKS')
    async getCommonBlocks(action: { data: { success: boolean, data?: Block }, peer: Peer }) {
        const { data, peer } = action;
        if (data.success) {
            // this.requestBlocks(data.data, peer);
        }
    }

    // TODO start on load
    @ON('EMIT_REQUEST_BLOCKS')
    async requestBlocks(): Promise<void> {
        SyncService.requestBlocks();
    }

    @ON('REQUEST_BLOCKS')
    async sendBlocks(action: { data: { height: number, limit: number }, peer: Peer }): Promise<void> {
        const { data, peer } = action;
        SyncService.sendBlocks(data, peer);
    }

    @ON('RESPONSE_BLOCKS')
    async loadBlocks(action: { data: { blocks: Array<Block> }, peer }): Promise<void> {
        const { data } = action;
        await BlockService.loadBlocks(data.blocks);
        if (!SyncService.consensus) {
            // TODO uncoment if load blocks work correct
            // this.requestBlocks();
        }
    }

    @ON('PEER_HEADERS_UPDATE')
    async updatePeer(action: { data, peer }) {
        const { data, peer } = action;
        PeerService.update(data, peer);
    }

    @ON('LAST_BLOCKS_UPDATE')
    async updateHeaders(data: { lastBlock }) {
        await SyncService.updateHeaders(data);
    }


}

export default new SyncController();
