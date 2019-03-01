import SyncService from 'core/service/sync';
import { ON } from 'core/util/decorator';
import { Block } from 'shared/model/block';
import { Peer } from 'shared/model/peer';
import { BaseController } from 'core/controller/baseController';
import PeerService from 'core/service/peer';
import BlockService from 'core/service/block';
import { logger } from 'shared/util/logger';
import { messageON } from 'shared/util/bus';

export class SyncController extends BaseController {
    constructor() {
        super();
        // TODO remove after test
        setTimeout(() => {
            messageON('EMIT_REQUEST_PEERS', {});
        }, 10000);
        setTimeout(() => {
            messageON('EMIT_SYNC_BLOCKS', {});
        }, 15000);
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

    @ON('EMIT_REQUEST_COMMON_BLOCKS')
    async emitRequestCommonBlocks(block: Block) {
        logger.debug(`[Controller][Sync][emitRequestCommonBlocks]}`);
        SyncService.requestCommonBlocks(block);
    }

    @ON('REQUEST_COMMON_BLOCKS')
    async checkCommonBlocks(action: { data: { block: Block }, peer: Peer }) {
        const { data, peer } = action;
        SyncService.checkCommonBlocks(data.block, peer);
    }

    @ON('RESPONSE_COMMON_BLOCKS')
    async getCommonBlocks(action: { data: { isExist: boolean, block?: Block }, peer: Peer }) {
        const { data, peer } = action;
        logger.debug(`[Controller][Sync][getCommonBlocks]: ${JSON.stringify(data)}`);
        if (data.isExist) {
            SyncService.requestBlocks(data.block, peer);
        } else {
            BlockService.deleteLastBlock();
            this.startSyncBlocks();
        }
    }

    // TODO start on load
    // TODO start if block decline and !consensus
    @ON('EMIT_SYNC_BLOCKS')
    async startSyncBlocks(): Promise<void> {
        logger.debug(`[Controller][Sync][startSyncBlocks]: CONSENSUS ${SyncService.getConsensus()}%`);
        if (SyncService.consensus) {
            return;
        }
        SyncService.checkCommonBlock();
    }

    @ON('REQUEST_BLOCKS')
    async sendBlocks(action: { data: { height: number, limit: number }, peer: Peer }): Promise<void> {
        const { data, peer } = action;
        SyncService.sendBlocks(data, peer);
    }

    @ON('RESPONSE_BLOCKS')
    async loadBlocks(action: { data: { blocks: Array<Block> }, peer }): Promise<void> {
        const { data } = action;
        logger.debug(`[Controller][Sync][loadBlocks]: BLOCKS: ${JSON.stringify(data.blocks)}`)
        await BlockService.loadBlocks(data.blocks);
        if (!SyncService.consensus) {
            // TODO uncoment if load blocks work correct
            // this.startSyncBlocks();
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
