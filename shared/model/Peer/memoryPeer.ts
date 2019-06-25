import { BlockData } from 'shared/model/types';
import { MAX_PEER_BLOCKS_IDS } from 'core/util/const';
import { FullHeaders, SerializedFullHeaders } from 'shared/model/Peer/fullHeaders';
import { Headers } from 'shared/model/Peer/headers';
import { Peer, SerializedPeer } from 'shared/model/Peer/index';
import { PEER_SOCKET_TYPE } from 'shared/model/types';

type SerializedMemoryPeer = SerializedPeer & {
    headers: SerializedFullHeaders;
    connectionType: PEER_SOCKET_TYPE;
};

export class MemoryPeer extends Peer {
    private _headers: FullHeaders;
    private _connectionType: PEER_SOCKET_TYPE;

    constructor(data: SerializedMemoryPeer) {
        super(data);
        this._headers = new FullHeaders(data.headers);
        this._connectionType = data.connectionType;
    }

    private clearBlockIdPoolByHeight(height: number) {
        [...this.headers.blocksIds.keys()]
            .filter(key => key >= height)
            .forEach(key => this.headers.blocksIds.delete(key));
    }

    get headers(): FullHeaders {
        return this._headers;
    }

    set headers(value: FullHeaders) {
        this._headers = value;
    }

    update(headers: Headers) {

        this.headers.height = headers.height;
        this.headers.broadhash = headers.broadhash;
        this.headers.peerCount = headers.peerCount;

        if (this.headers.blocksIds.has(headers.height)) {
            this.clearBlockIdPoolByHeight(headers.height);
        }

        this.headers.blocksIds.set(headers.height, headers.broadhash);
        if (this.headers.blocksIds.size > MAX_PEER_BLOCKS_IDS) {
            const min = Math.min(...this.headers.blocksIds.keys());
            this.headers.blocksIds.delete(min);
        }
    }

    get minHeight() {
        return Math.min(...this.headers.blocksIds.keys());
    }

    blockExist(blockData: BlockData): boolean {
        return this.headers.blocksIds.has(blockData.height)
            && this.headers.blocksIds.get(blockData.height) === blockData.id;
    }

    blockHeightExist(height: number): boolean {
        return this.headers.blocksIds.has(height);
    }
}
