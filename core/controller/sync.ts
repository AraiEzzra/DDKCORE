import SyncService from 'core/service/sync';
import { ON } from 'core/util/decorator';
import { Block } from 'shared/model/block';
import { Peer } from 'shared/model/peer';
import { BaseController } from 'core/controller/baseController';
import PeerService from 'core/service/peer';
import BlockService from 'core/service/block';
import { logger } from 'shared/util/logger';

export class SyncController extends BaseController {

    @ON('NEW_BLOCK')
    async newBlock(action: { data: { block: Block } }): Promise<void> {
        const { data } = action;
        logger.debug(`[Controller][Sync][newBlock] block id ${data.block.id}`);
        await BlockService.processIncomingBlock(data.block);
    }

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

    // TODO call after several minutes or by interval
    @ON('EMIT_REQUEST_COMMON_BLOCKS')
    async emitRequestCommonBlocks() {
        SyncService.requestCommonBlocks();
    }

    @ON('REQUEST_COMMON_BLOCKS')
    async checkCommonBlocks(action: { data: { blockIds: Array<number> }, peer: Peer }) {
        const { data, peer } = action;
        SyncService.checkCommonBlocks(data.blockIds, peer);
    }

    @ON('RESPONSE_COMMON_BLOCKS')
    async getCommonBlocks(action: { data: boolean, peer: Peer }) {
        const { data, peer } = action;
        if (data) {
            this.requestBlocks(peer);
        }
    }

    @ON('EMIT_REQUEST_BLOCKS')
    async requestBlocks(peer: Peer): Promise<void> {
        SyncService.requestBlocks(peer);
    }

    @ON('REQUEST_BLOCKS')
    async sendBlocks(action: { data: { height: number, limit: number }, peer: Peer }): Promise<void> {
        const { data, peer } = action;
        SyncService.sendBlocks(data, peer);
    }

    @ON('RESPONSE_BLOCKS')
    async getBlocks(action: { data: { blocks: Array<Block> }, peer }): Promise<void> {
        const { data, peer } = action;
        //    TODO call block service and insert blocks
    }

    @ON('PEER_HEADERS_UPDATE')
    async updatePeer(action: { data: { headers }, peer }) {
        const { data, peer } = action;
        PeerService.update(data.headers, peer);
    }

    @ON('LAST_BLOCKS_UPDATE')
    async updateHeaders(data: {blockIds, lastBlock}) {
        SyncService.updateHeaders(data);
    }


}

export default new SyncController();
