import { Peer } from 'shared/model/peer';
import { PeerService } from 'core/service/peer';
import { Block } from 'shared/model/block';
import { BlockService } from 'core/service/block';
import { Signature } from 'shared/model/signature';

interface ICommonBlockRequest {
    body: {
        ids: string;
    };
    ip: string;
    headers: {
        port: number;
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
    ip: string;
    headers: {
        port: number;
    };
}

interface IPostSignaturesRequest {
    body: {
        signatures: Signature[];
        signature: Signature;
    };
}

interface IPostTransactionsRequest {
    body: {
        transactions: Transaction[];
        transaction: Transaction;
    };
    ip: string;
    headers: {
        port: number;
    };
}

// wait for @Dima Mekhed
class Transaction {

}

@Controller('/peer')
export class PeerController {
    private peerService = new PeerService();
    private blockService = new BlockService();

    constructor() {}

    private handshake(ip: string, port: number, headers: object): Peer {
        return new Peer({});
    }

    @GET('/blocks/common')
    public blocksCommon(req: ICommonBlockRequest): { common: number; } {
        let ip: string = req.ip;
        let port: number = req.headers.port;
        let peer : Peer = this.handshake(ip, port, req.headers);
        this.peerService.remove();
        return { common: 0 };
    }

    @GET('/blocks')
    public blocks(req: IBlockRequest) : { blocks: Block[]; } {
        this.blockService.loadBlocksData({
            limit: 34,
            lastId: req.body.lastBlockId
        });

        return { blocks: [] };
    }

    @GET('/list')
    public list(): Peer[] {
        this.peerService.list();
        return [];
    }

    @GET('/height')
    public height() {
        return { height: this.blockService.getLastBlock().height };
    }

    ping() {} // remove, peers use height

    @GET('/signatures')
    public getSignatures() {} // uses logic connected to multisignature transactions in transactionPool

    @GET('/transactions')
    public getTransactions() {} // transaction[] unconfirmed + multisignatures + queued

    @POST('/blocks')
    public postBlock(req: IPostBlockRequest): { blockId: string } {
        let block: Block = req.body.block;
        let ip: string = req.ip;
        let port: number = req.headers.port;
        let peer : Peer = this.handshake(ip, port, req.headers);

        // blockService.objectNormalize ?
        // broadcast 'receiveBlock'

        return { blockId: block.id };
    }

    @POST('/signatures')
    public postSignatures(req: IPostSignaturesRequest): void {
        let signatures: Signature[] = req.body.signatures;
        let signature: Signature = req.body.signature;
        this.receiveSignatures(signatures ? signatures : [signature]);
    }

    @POST('/transactions')
    public postTransactions(req: IPostTransactionsRequest) {
        let transactions: Transaction[] = req.body.transactions;
        let transaction: Transaction = req.body.transaction;
        this.receiveTransactions(transactions ? transactions : [transaction]);

    }

    private receiveSignatures(signatures: Signature[]): void {
        // complex logic connected to multisignatures module ->
        // calls accounts.getAccount, publish messages in the bus and through socket
    }

    private receiveTransactions(signatures: Transaction[]): void {
        // blockService.objectNormalize ?
        // transactions.processUnconfirmedTransaction
    }
}
