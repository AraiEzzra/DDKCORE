import { Peer } from 'shared/model/peer';
import { Block } from 'shared/model/block';
import BlockRepo from 'core/repository/block/';
import { Transaction } from 'shared/model/transaction';
import { ResponseEntity } from 'shared/model/response';
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

    private handshake(ip: string, port: number, headers: object): ResponseEntity<Peer> {
        return new ResponseEntity({data: new Peer()});
    }

    @RPC('COMMON_BLOCK')
    public blocksCommon(req: ICommonBlockRequest, additionalData: IAdditionalData): ResponseEntity<{ common: number; }> {
        let ip: string = additionalData.ip;
        let port: number = additionalData.headers.port;
        let peerResponse : ResponseEntity<Peer> = this.handshake(ip, port, additionalData.headers);
        if (peerResponse.errors) {
            peerResponse.errors.push('/blocks/common');
            return new ResponseEntity<{common: number}>({ errors: peerResponse.errors });
        }
        PeerRepo.removePeer(peerResponse.data);
        return new ResponseEntity<{common: number}>({ data: { common: 0 }});
    }

    @RPC('GET_BLOCKS')
    public blocks(req: IBlockRequest) : ResponseEntity<{blocks: Array<Block>}> {
        return new ResponseEntity<{blocks: Array<Block>}>({ data: { blocks: [] } });
    }

    @RPC('GET_PEERS_LIST')
    public list(): ResponseEntity<Array<Peer>> {
        PeerRepo.peerList();
        return new ResponseEntity<Array<Peer>>({ data: [] });
    }

    @RPC('GET_HEIGHT')
    public height() : ResponseEntity<{ height: number }> {
        return new ResponseEntity<{height: number}>({ data : { height: BlockRepo.getLastBlock().height } });
    }

    @RPC('GET_TRANSACTIONS_COUNT')
    public getTransactions() {} // transaction[] unconfirmed + multisignatures + queued

    @RPC('RECEIVE_BLOCK')
    public postBlock(req: IPostBlockRequest, additionalData: IAdditionalData): ResponseEntity<{ blockId: string }> {
        let block: Block = req.body.block;
        let ip: string = additionalData.ip;
        let port: number = additionalData.headers.port;
        let peerResponse : ResponseEntity<Peer> = this.handshake(ip, port, additionalData.headers);
        if (peerResponse.errors) {
            peerResponse.errors.push('/blocks/common');
            return new ResponseEntity<{ blockId: string }>({ errors: peerResponse.errors });
        }
        let peer : Peer = peerResponse.data;

        // blockService.objectNormalize ?
        // broadcast 'receiveBlock'

        return new ResponseEntity<{ blockId: string }>({data: { blockId: block.id }});
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
        // PeerService.insertSeeds();
        // PeerService.discover();
    }

    // @todo should be called each 10 sec
    @ON('PEERS_DISCOVER')
    public discover() {
        // PeerService.discover();
        // PeerService.updatePeers();
        // PeerService.removeBans();
    }
}

export default new PeerController();
