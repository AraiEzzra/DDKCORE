import os from 'os';
import { Block } from 'shared/model/block';

export const env = require('../../config/env').default;

export class Headers {
    os: string;
    version: string;
    port: number;
    height: number;
    nethash: string;
    broadhash: string;
    minVersion: string;
    nonce: string;
    ip: string;
    blocksIds: Map<number, string>;

    constructor() {
        this.blocksIds = new Map();
        this.os = os.platform() + os.release();
        this.port = env.serverPort;
        this.ip = env.serverHost;
        this.broadhash = null;
        this.height = 1;
    }

    update(data) {
        this.broadhash = data.broadhash || this.broadhash;
        this.height = data.height || this.height;
        this.minVersion = data.minVersion || this.minVersion;
        this.nonce = data.nonce || this.nonce;
    }

    setBroadhash(lastBlock: Block) {
        this.broadhash = lastBlock.id;
    }

    addBlockIdInPool(lastBlock: Block) {
        this.blocksIds.set(lastBlock.height, lastBlock.id);
        if (this.blocksIds.size > 100) {
            const min = Math.min(...this.blocksIds.keys());
            this.blocksIds.delete(min);
        }
    }

    setHeight(lastBlock: Block) {
        this.height = lastBlock.height;
    }

    getHeaders() {
        return {
            height: this.height,
            nethash: this.nethash,
            broadhash: this.broadhash,
            nonce: this.nonce,
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
