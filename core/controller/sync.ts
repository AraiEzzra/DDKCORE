import { SyncService } from 'core/service/sync';
import { Response, Request } from 'express';

export default class SyncController {
    private syncService: SyncService;

    constructor() {
        this.syncService = new SyncService();
    }


    getBlocks(query) {
    }

    getSignatures(req: Request) {
    }

    getTransactions(req: Request) {
    }

    postBlock(block, peer, extraLogMessage) {
    }

    postSignatures(query) {
    }

    postTransactions(query, peer, extraLogMessage) {
    }

    blocksCommon(ids, peer, extraLogMessage) {
    }


    list(req) {
    }

    blockHeight(req: Request) {
    }

    ping(req) {
    }

    postDappMessage(query) {
    }

    postDappRequest(query) {
    }

    handshake(data: { ip, port, headers, validateHeaders }) {
        this.syncService.handshake(data);
    }

    message(msg) {
    };

    request(msg: string) {
    }
}
