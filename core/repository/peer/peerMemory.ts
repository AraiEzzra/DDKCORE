import { BlockData, PeerAddress } from 'shared/model/types';
import { MemoryPeer } from 'shared/model/Peer/memoryPeer';
import IPeerRepository from 'core/repository/peer/index';
import { SerializedFullHeaders } from 'shared/model/Peer/fullHeaders';
import PeerNetworkRepository from 'core/repository/peer/peerNetwork';
import SystemRepository from 'core/repository/system';
import { PEER_SOCKET_TYPE } from 'shared/model/types';

class PeerMemoryRepository implements IPeerRepository <PeerAddress, MemoryPeer> {
    private peers: Map<string, MemoryPeer>;

    constructor() {
        this.peers = new Map();
    }

    add(peerAddress: PeerAddress, headers: SerializedFullHeaders, connectionType: PEER_SOCKET_TYPE) {
        this.peers.set(
            `${peerAddress.ip}:${peerAddress.port}`,
            new MemoryPeer({ peerAddress, headers, connectionType })
        );
        SystemRepository.update({ peerCount: this.count });
    }

    remove(peerAddress: PeerAddress): void {
        this.peers.delete(`${peerAddress.ip}:${peerAddress.port}`);
        SystemRepository.update({ peerCount: this.count });
    }

    removeAll() {
        this.peers.clear();
        SystemRepository.update({ peerCount: this.count });
    }

    get(peerAddress: PeerAddress): MemoryPeer {
        return this.peers.get(`${peerAddress.ip}:${peerAddress.port}`);
    }

    getManyByAddress(peerAddresses: Array<PeerAddress>): Array<MemoryPeer> {
        return peerAddresses.filter((peerAddress: PeerAddress) => this.has(peerAddress))
            .map((peerAddress: PeerAddress) => this.get(peerAddress));
    }

    getAll(): Array<MemoryPeer> {
        return [...this.peers.values()];
    }

    getPeerAddresses(): Array<PeerAddress & { peerCount: number }> {
        return this.getAll().map((peer: MemoryPeer) => ({
            ...peer.peerAddress,
            peerCount: peer.headers.peerCount,
        }));
    }

    has(peerAddress: PeerAddress): boolean {
        return this.peers.has(`${peerAddress.ip}:${peerAddress.port}`);
    }

    getUnbanPeers(): Array<MemoryPeer> {
        return [...this.peers.values()].filter((peer: MemoryPeer) => {
            return !PeerNetworkRepository.isBanned(peer.peerAddress);
        });
    }

    getByHeightBlockExist(height: number, memoryPeers?: Array<MemoryPeer>): Array<MemoryPeer> {
        return (memoryPeers || [...this.peers.values()]).filter((memoryPeer: MemoryPeer) => {
            return memoryPeer.blockHeightExist(height);
        });
    }

    getLessPeersByFilter(height, broadhash): Array<MemoryPeer> {

        return [...this.peers.values()].filter((peer: MemoryPeer) => {
            return peer.headers.height <= height
                && peer.headers.broadhash !== broadhash;

        });
    }

    get count(): number {
        return this.peers.size;
    }
}

export default new PeerMemoryRepository();
