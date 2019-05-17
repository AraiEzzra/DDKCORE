import os from 'os';
import { Block } from 'shared/model/block';
import config from 'shared/config';
import PeerRepository from 'core/repository/peer';

export const MAX_BLOCK_IN_MEMORY = 100;

class Headers {
    os: string;
    version: string;
    port: number;
    height: number;
    broadhash: string;
    minVersion: number;
    ip: string;
    blocksIds: Map<number, string>;
    synchronization: boolean;

    constructor() {
        this.synchronization = false;
        this.blocksIds = new Map();
        this.os = os.platform() + os.release();
        this.port = config.CORE.SOCKET.PORT;
        this.ip = config.PUBLIC_HOST;
        this.broadhash = null;
        this.height = 1;
        this.minVersion = 1;
        this.version = config.CORE.VERSION;
    }

    get peerCount(): number {
        return PeerRepository.peerList().length;
    }

    update(data) {
        this.broadhash = data.broadhash || this.broadhash;
        this.height = data.height || this.height;
        this.minVersion = data.minVersion || this.minVersion;
    }

    setBroadhash(lastBlock: Block) {
        this.broadhash = lastBlock.id || null;
    }

    addBlockIdInPool(lastBlock: Block) {

        if (this.blocksIds.has(lastBlock.height)) {
            this.clearPoolByHeight(lastBlock.height);
        }
        this.blocksIds.set(lastBlock.height, lastBlock.id);
        if (this.blocksIds.size > MAX_BLOCK_IN_MEMORY) {
            const min = Math.min(...this.blocksIds.keys());
            this.blocksIds.delete(min);
        }
    }

    clearPoolByHeight(height: number) {
        [...this.blocksIds.keys()]
        .filter(key => key >= height)
        .map(key => this.blocksIds.delete(key));
    }

    setHeight(lastBlock: Block) {
        this.height = lastBlock.height || 1;
    }

    getHeaders() {
        return {
            height: this.height,
            broadhash: this.broadhash,
            peerCount: this.peerCount,
        };
    }

    getFullHeaders() {
        return {
            os: this.os,
            version: this.version,
            port: this.port,
            minVersion: this.minVersion,
            ip: this.ip,
            blocksIds: [...this.blocksIds],
            ...this.getHeaders(),
        };
    }

}

export default new Headers();
