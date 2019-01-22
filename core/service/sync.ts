import { SyncRepo } from 'core/repository/sync';
import { Broadcaster } from 'core/repository/broadcaster';


export interface IModules {
    blocks;
    transport;
    dapps;
    multisignatures;
    transactions;
    peers;
}

export interface ILogic {
    block;
    transaction;
    peers;
}

export interface ISyncService {

    handshake(data): void

    networkCompatible(nethash: string): boolean

    versionCompatible(version: string): boolean

    getBroadhash(): string

    update(): void

    poorConsensus(): boolean

    getFromRandomPeer()

    getFromPeer()

    removePeer(options, extraMessage)

    receiveSignatures(query)

    receiveSignature(signature)

    receiveTransactions(query, peer, extraLogMessage)

    receiveTransaction(transaction, peer, extraLogMessage)

    onNewBlock(block, broadcast)
}

export class SyncService implements ISyncService {

    private broadcaster: Broadcaster;

    private syncRepo: SyncRepo;

    constructor() {
        this.syncRepo = new SyncRepo();
    }

    handshake(data) {

    }

    networkCompatible(nethash: string) {
    }


    versionCompatible(version: string) {
    }

    getBroadhash() {
    }

    update() {
    }

    poorConsensus() {
    }

    getFromRandomPeer() {
    }

    getFromPeer() {
    }

    removePeer(options, extraMessage) {
    }

    receiveSignatures(query) {
    }

    receiveSignature(signature) {
    }

    receiveTransactions(query, peer, extraLogMessage) {
    }

    receiveTransaction(transaction, peer, extraLogMessage) {
    }

    onNewBlock(block, broadcast) {
    }
}
