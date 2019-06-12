import { PeerAddress } from 'shared/model/types';

export type SerializedPeer = {
    peerAddress: PeerAddress
};

export class Peer {
    private _peerAddress: PeerAddress;

    constructor(data: SerializedPeer) {
        this._peerAddress = data.peerAddress;
    }

    get peerAddress(): PeerAddress {
        return this._peerAddress;
    }
}

