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
        this.port = 8080;
        this.ip = '0.0.0.0'
    }
}

export interface IConfigSync {
    peersTimeout: number;
    minBroadhashConsensus: number;
}
