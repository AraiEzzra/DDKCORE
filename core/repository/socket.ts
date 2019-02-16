import autobind from 'autobind-decorator';
import * as ioClient from 'socket.io-client';
import * as io from 'socket.io';
import { Headers } from 'core/repository/system';
import { Peer } from 'shared/model/peer';
import { PeerRepo } from 'core/repository/peer';

const ioServer = io({
    serveClient: false,
    wsEngine: 'ws',
});

// todo import port from env
ioServer.listen(8080);

// todo get peer list from env
export const TRUSTED_PEERS = [
    { ip: '0.0.0.0', port: 8081 },
    { ip: '0.0.0.0', port: 8082 }
];

// todo get black list from env
const BLACK_LIST = new Set(['0.0.0.0:8080']);

export default class Socket {
    private static _instance: Socket;
    private peerRepo: PeerRepo;

    constructor() {
        if (Socket._instance) {
            return Socket._instance;
        }
        this.peerRepo = new PeerRepo();
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
                const peer = JSON.parse(data);
                if (Socket._instance.addPeer(peer, socket)) {
                    socket.emit('READY');
                }
            });
        });
    }

    @autobind
    connectNewPeer(peer: Peer): void {
        if (BLACK_LIST.has(`${peer.ip}:${peer.port}`) ||
            this.peerRepo.has(peer)) {
            return;
        }
        const ws = ioClient(`ws://${peer.ip}:${peer.port}`);
        ws.on('OPEN', () => {
            ws.emit('HEADERS', JSON.stringify(
                new Headers()
            ));
            ws.on('READY', () => {
                Socket._instance.addPeer(peer, ws);
            });
        });
    }

    @autobind
    addPeer(peer: Peer, socket): boolean {
        if (this.peerRepo.addPeer(peer, socket)) {
            socket.on('ACTION', (response: string) => Socket._instance.onPeerAction(response, peer));

            peer.socket.on('disconnect', () => {
                this.peerRepo.removePeer(peer);
            });
            return true;
        }
        return false;
    }

    @autobind
    onPeerAction(response: string, peer: Peer): void {

        const { code, data } = JSON.parse(response);
        // todo call rx subject
    }

    @autobind
    emitPeers(code, data, peers: Array<Peer> = null): void {
        (peers || this.peerRepo.peerList()).forEach(peer => {
            this.emitPeer(code, data, peer);
        });
    }

    @autobind
    emitPeer(code, data, peer): void {
        if (!(this.peerRepo.has(peer))) {
            console.error(`Peer ${peer.ip}:${peer.port} is offline`);
            return;
        }
        if (!peer.socket) {
            peer = this.peerRepo.getPeerFromPool(peer);
        }
        peer.socket.emit(
            'ACTION',
            JSON.stringify({ code, data })
        );
    }
}
