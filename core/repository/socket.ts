import autobind from 'autobind-decorator';
import headers from 'core/repository/system';
import { Peer } from 'shared/model/peer';
import { messageON } from 'shared/util/bus';
import { logger } from 'shared/util/logger';
import io from 'socket.io-client';
import PeerRepository from 'core/repository/peer';
// TODO remove http
const server = require('http').createServer();
const ioServer = require('socket.io')(server, {
    serveClient: false,
    wsEngine: 'ws',
});
const env = require('../../config/env').default;
import { TRUSTED_PEERS } from 'core/repository/peer';
import { BLACK_LIST } from 'core/repository/peer';

server.listen(
    env.serverPort,
    env.serverHost
);


export class Socket {
    private static _instance: Socket;

    constructor() {
        if (Socket._instance) {
            return Socket._instance;
        }
        this.init();
        Socket._instance = this;
    }

    init(): void {
        TRUSTED_PEERS.forEach((peer: any) => {
            this.connectNewPeer(peer);
        });
        ioServer.on('connect', function (socket) {
            socket.emit('OPEN');
            socket.on('HEADERS', (data: string) => {
                logger.debug(`[SOCKET][PEER_HEADERS_RECEIVE], data: ${JSON.stringify(data)}`);
                const peer = JSON.parse(data);
                if (Socket._instance.addPeer(peer, socket)) {
                    socket.emit('READY');
                }
            });
        });
    }

    @autobind
    connectNewPeer(peer: Peer): void {
        if (BLACK_LIST.has(`${peer.ip}`) ||
            PeerRepository.has(peer)) {
            return;
        }
        const ws = io(`ws://${peer.ip}:${peer.port}`);
        ws.on('OPEN', () => {
            ws.emit('HEADERS', JSON.stringify(
                headers.getFullHeaders()
            ));
            ws.on('READY', () => {
                Socket._instance.addPeer(peer, ws);
            });
        });
    }

    @autobind
    addPeer(peer: Peer, socket): boolean {
        if (PeerRepository.addPeer(peer, socket)) {
            logger.debug(`[SOCKET][ADD_PEER] host: ${peer.ip}:${peer.port}`);
            socket.on('ACTION', (response: string) => Socket._instance.onPeerAction(response, peer));

            peer.socket.on('disconnect', () => {
                PeerRepository.removePeer(peer);
            });
            return true;
        }
        return false;
    }

    @autobind
    onPeerAction(response: string, peer: Peer): void {
        const { code, data } = JSON.parse(response);
        logger.debug(`[SOCKET][ON_PEER_ACTION][${peer.ip}:${peer.port}], CODE: ${code}, DATA: ${JSON.stringify(data)}`);
        messageON(code, { data, peer });
    }

    @autobind
    emitPeers(code, data, peers: Array<Peer> = null): void {
        (peers || PeerRepository.peerList()).forEach(peer => {
            this.emitPeer(code, data, peer);
        });
    }

    @autobind
    emitPeer(code, data, peer): void {
        if (!(PeerRepository.has(peer))) {
            logger.error(`Peer ${peer.ip}:${peer.port} is offline`);
            return;
        }
        if (!peer.socket) {
            peer = PeerRepository.getPeerFromPool(peer);
        }
        peer.socket.emit(
            'ACTION',
            JSON.stringify({ code, data })
        );
    }
}

export default new Socket();
