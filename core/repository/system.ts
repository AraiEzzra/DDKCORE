import os from 'os';
import crypto from 'crypto';
export const env = require('../../config/env').default;

export class Headers {
    os: string;
    version: string;
    port: number;
    height: 1;
    nethash: string;
    broadhash: string;
    minVersion: string;
    nonce: string;
    ip: string;

    constructor() {
        this.os = os.platform() + os.release();
        this.port = env.serverPort;
        this.ip = env.serverHost;
        this.broadhash = null;
    }

    update(data) {
        this.broadhash = data.broadhash || this.broadhash;
        this.height = data.height || this.height;
        this.minVersion = data.minVersion || this.minVersion;
        this.nonce = data.nonce || this.nonce;
    }

    generateBroadhash(ids: Array<any>) {
        if (ids.length <= 1) {
            return this.broadhash;
        }
        const seed = ids.join('');
        const hash = crypto.createHash('sha256').update(seed, 'utf8').digest();
        return hash.toString('hex');
    };
}

export default new Headers();
