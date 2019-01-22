import { PeerService } from 'core/service/peer';

export class PeerController {
    private peerService = new PeerService();

    constructor() {}

    handshake(ip: string, port: number, headers: object, validateHeaders) {

    }

    blocksCommon() {}

    blocks() {}

    list() {}

    height() {}

    ping() {}

    getSignatures() {}

    getTransactions() {}

    postDappMessage() {}

    postDappRequest() {}

    postBlock() {}

    postSignatures() {}

    postTransactions() {}


}
