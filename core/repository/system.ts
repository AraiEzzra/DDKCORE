import os from 'os';
import { Block } from 'shared/model/block';
import config from 'shared/config';
import PeerMemoryRepository from 'core/repository/peer/peerMemory';
import { FullHeaders } from 'shared/model/Peer/fullHeaders';
import { PeerAddress } from 'shared/model/types';

export const MAX_BLOCK_IN_MEMORY = 100;

class SystemRepository {
    headers: FullHeaders;
    synchronization: boolean;
    address: PeerAddress;

    constructor() {
        this.synchronization = false;
        this.address = { ip: config.PUBLIC_HOST, port: config.CORE.SOCKET.PORT };

        this.headers = new FullHeaders({
            blocksIds: [],
            os: os.platform() + os.release(),
            broadhash: null,
            height: 1,
            version: config.CORE.VERSION,
            minVersion: config.CORE.MIN_VERSION,
            peerCount: 0,
        });
    }

    update(data) {
        this.headers.broadhash = data.broadhash || this.headers.broadhash;
        this.headers.height = data.height || this.headers.height;
    }

    addBlockIdInPool(lastBlock: Block) {

        if (this.headers.blocksIds.has(lastBlock.height)) {
            this.clearPoolByHeight(lastBlock.height);
        }
        this.headers.blocksIds.set(lastBlock.height, lastBlock.id);
        if (this.headers.blocksIds.size > MAX_BLOCK_IN_MEMORY) {
            const min = Math.min(...this.headers.blocksIds.keys());
            this.headers.blocksIds.delete(min);
        }
    }

    clearPoolByHeight(height: number) {
        [...this.headers.blocksIds.keys()]
            .filter(key => key >= height)
            .forEach(key => this.headers.blocksIds.delete(key));
    }

    getHeaders() {
        return {
            height: this.headers.height,
            broadhash: this.headers.broadhash,
            peerCount: PeerMemoryRepository.count,
        };
    }

    getFullHeaders(): FullHeaders {
        return this.headers;
    }

}

export default new SystemRepository();
