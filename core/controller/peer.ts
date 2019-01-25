import { Peer } from 'shared/model/peer';
import { PeerService } from 'core/service/peer';
import { Block } from 'shared/model/block';
import { BlockService } from 'core/service/block';
import { Transaction } from 'shared/model/transaction';
import Response from 'shared/model/response';
import { Controller, GET } from 'core/util/decorator';

interface ICommonBlockRequest {
    body: {
        ids: string;
    };
}

interface IBlockRequest {
    body: {
        lastBlockId: string;
    };
}

interface IPostBlockRequest {
    body: {
        block: Block;
    };
}

interface IPostTransactionsRequest {
    body: {
        transactions: Transaction<object>[];
        transaction: Transaction<object>;
    };
}

interface IAdditionalData {
    ip: string;
    headers: {
        port: number;
    };
}

@Controller('/peer')
export class PeerController {
    private peerService = new PeerService();
    private blockService = new BlockService();

    constructor() {}

    private handshake(ip: string, port: number, headers: object): Peer {
        return new Peer();
    }

    @GET('/blocks/common')
    public blocksCommon(req: ICommonBlockRequest, additionalData: IAdditionalData): Response<{ common: number; }> {
        let ip: string = additionalData.ip;
        let port: number = additionalData.headers.port;
        let peerResponse : Response<Peer> = this.handshake(ip, port, additionalData.headers);
        if (peerResponse.errors) {
            peerResponse.errors.push('/blocks/common');
            return new Response<{common: number}>({ errors: peerResponse.errors });
        }
        this.peerService.remove(peer);
        return new Response({ data: { common: 0 }});
    }

    @GET('/blocks')
    public blocks(req: IBlockRequest) : Response<{ blocks: Block[]; }> {
        this.blockService.loadBlocksData({
            limit: 34,
            lastId: req.body.lastBlockId
        });
        return new Response({ data: { blocks: [] } });
    }

    @GET('/list')
    public list(): Response<Peer[]> {
        this.peerService.list();
        return new Response({ data: [] });
    }

    @GET('/height')
    public height() : Response<{ height: number }> {
        return new Response<{height: number}>({ data : { height: this.blockService.getLastBlock().height } });
    }

    ping() {} // remove, peers use height

    @GET('/transactions')
    public getTransactions() {} // transaction[] unconfirmed + multisignatures + queued

    @POST('/blocks')
    public postBlock(req: IPostBlockRequest, additionalData: IAdditionalData): { blockId: string } {
        let block: Block = req.body.block;
        let ip: string = additionalData.ip;
        let port: number = additionalData.headers.port;
        let peer : Peer = this.handshake(ip, port, additionalData.headers);

        // blockService.objectNormalize ?
        // broadcast 'receiveBlock'

        return { blockId: block.id };
    }

    @POST('/transactions')
    public postTransactions(req: IPostTransactionsRequest) {
        let transactions: Transaction<object>[] = req.body.transactions;
        let transaction: Transaction<object> = req.body.transaction;
        this.receiveTransactions(transactions ? transactions : [transaction]);

    }

    private receiveTransactions(transactions: Transaction<object>[]): void {
        // blockService.objectNormalize ?
        // transactions.processUnconfirmedTransaction
    }

    @ON('BLOCKCHAIN_READY')
    public initDiscover() {
        this.peerService.insertSeeds();
        this.peerService.discover();
    }

    // @todo should be called each 10 sec
    @ON('PEERS_DISCOVER')
    public discover() {
        this.peerService.discover();
        this.peerService.updatePeers();
        this.peerService.removeBans();
    }
}
