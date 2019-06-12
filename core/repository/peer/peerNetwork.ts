import { NetworkPeer } from 'shared/model/Peer/networkPeer';
import { PeerAddress } from 'shared/model/types';
import IPeerRepository from 'core/repository/peer/index';
import { logger } from 'shared/util/logger';


class PeerNetworkRepository implements IPeerRepository <PeerAddress, NetworkPeer> {
    private peers: Map<string, NetworkPeer>;
    private banList: Set<string>;

    constructor() {
        this.peers = new Map();
        this.banList = new Set();
    }

    ban(peerAddress: PeerAddress): void {
        logger.debug(`[Repository][Peer][ban] peer ${peerAddress.ip}:${peerAddress.port} has been banned`);
        this.banList.add(`${peerAddress.ip}:${peerAddress.port}`);
        if (this.has(peerAddress)) {
            const peer = this.get(peerAddress);
            peer.ban();
        }
    }

    unban(peerAddress: PeerAddress): void {
        logger.debug(`[Repository][Peer][unban] peer ${peerAddress.ip}:${peerAddress.port}`);
        this.banList.delete(`${peerAddress.ip}:${peerAddress.port}`);
        if (this.has(peerAddress)) {
            const peer = this.get(peerAddress);
            peer.unban();
        }
    }

    isBanned(peerAddress: PeerAddress): boolean {
        return this.banList.has(`${peerAddress.ip}:${peerAddress.port}`);
    }

    clearBanList(): void {
        this.banList.clear();
    }

    add(peerAddress: PeerAddress, socket: SocketIO.Socket | SocketIOClient.Socket): void {
        this.peers.set(
            `${peerAddress.ip}:${peerAddress.port}`,
            new NetworkPeer({
                peerAddress,
                socket,
                isBanned: this.isBanned(peerAddress)
            })
        );
    }

    remove(peerAddress: PeerAddress): void {
        if (!this.has(peerAddress)) {
            return;
        }
        const peer = this.get(peerAddress);
        peer.disconnect();
        this.peers.delete(`${peerAddress.ip}:${peerAddress.port}`);
    }

    removeAll(): void {
        [...this.peers.keys()].forEach(key => {
            this.peers.get(key).disconnect();
            this.peers.delete(key);
        });
    }

    get(peerAddress: PeerAddress): NetworkPeer {
        return this.peers.get(`${peerAddress.ip}:${peerAddress.port}`);
    }

    getManyByAddress(peerAddresses: Array<PeerAddress>): Array<NetworkPeer> {
        return peerAddresses.filter((peerAddress: PeerAddress) => this.has(peerAddress))
            .map((peerAddress: PeerAddress) => this.get(peerAddress));
    }

    getAll(): Array<NetworkPeer> {
        return [...this.peers.values()];
    }

    has(peerAddress: PeerAddress): boolean {
        return this.peers.has(`${peerAddress.ip}:${peerAddress.port}`);
    }

    get count(): number {
        return this.peers.size;
    }
}

export default new PeerNetworkRepository();
