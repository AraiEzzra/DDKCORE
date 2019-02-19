import { Peer } from 'shared/model/peer';
import PeerService from 'core/service/peer';
import { Block } from 'shared/model/block';
import BlockService from 'core/service/block';
import { Transaction } from 'shared/model/transaction';
import Response from 'shared/model/response';
import { ON, RPC } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import PeerRepo from 'core/repository/peer';

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
        transactions: Array<Transaction<object>>;
        transaction: Transaction<object>;
    };
}

interface IAdditionalData {
    ip: string;
    headers: {
        port: number;
    };
}

// todo: check if this controller is redundant, cause all actions are for transport
class PeerController extends BaseController {

    private handshake(ip: string, port: number, headers: object): Response<Peer> {
        return new Response({data: new Peer()});
    }

    @RPC('COMMON_BLOCK')
    public blocksCommon(req: ICommonBlockRequest, additionalData: IAdditionalData): Response<{ common: number; }> {
        let ip: string = additionalData.ip;
        let port: number = additionalData.headers.port;
        let peerResponse : Response<Peer> = this.handshake(ip, port, additionalData.headers);
        if (peerResponse.errors) {
            peerResponse.errors.push('/blocks/common');
            return new Response<{common: number}>({ errors: peerResponse.errors });
        }
        PeerRepo.removePeer(peerResponse.data);
        return new Response({ data: { common: 0 }});
    }

    @RPC('GET_BLOCKS')
    public blocks(req: IBlockRequest) : Response<{ blocks: Array<Block>; }> {
        return new Response({ data: { blocks: [] } });
    }

    @RPC('GET_PEERS_LIST')
    public list(): Response<Array<Peer>> {
        PeerRepo.peerList();
        return new Response({ data: [] });
    }

    @RPC('GET_HEIGHT')
    public height() : Response<{ height: number }> {
        return new Response<{height: number}>({ data : { height: BlockService.getLastBlock().height } });
    }

    @RPC('GET_TRANSACTIONS_COUNT')
    public getTransactions() {} // transaction[] unconfirmed + multisignatures + queued

    @RPC('RECEIVE_BLOCK')
    public postBlock(req: IPostBlockRequest, additionalData: IAdditionalData): Response<{ blockId: string }> {
        let block: Block = req.body.block;
        let ip: string = additionalData.ip;
        let port: number = additionalData.headers.port;
        let peerResponse : Response<Peer> = this.handshake(ip, port, additionalData.headers);
        if (peerResponse.errors) {
            peerResponse.errors.push('/blocks/common');
            return new Response<{ blockId: string }>({ errors: peerResponse.errors });
        }
        let peer : Peer = peerResponse.data;

        // blockService.objectNormalize ?
        // broadcast 'receiveBlock'

        return new Response({data: { blockId: block.id }});
    }

    @RPC('RECEIVE_TRANSACTIONS')
    public postTransactions(req: IPostTransactionsRequest) {
        let transactions: Array<Transaction<object>> = req.body.transactions;
        let transaction: Transaction<object> = req.body.transaction;
        this.receiveTransactions(transactions ? transactions : [transaction]);

    }

    private receiveTransactions(transactions: Array<Transaction<object>>): void {
        // blockService.objectNormalize ?
        // transactions.processUnconfirmedTransaction
    }

    @ON('BLOCKCHAIN_READY')
    public initDiscover() {
        // PeerService.addPeer();
        // PeerService.discover();
    }

    // @todo should be called each 10 sec
    @ON('PEERS_DISCOVER')
    public discover() {
        /*
        PeerService.discover();
        PeerService.updatePeers();
        PeerService.removeBans();
        */
    }
}

export default new PeerController();
