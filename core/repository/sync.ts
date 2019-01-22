interface IHeaders {
    os: string;
    version: string;
    port: number;
    height: 1;
    nethash: string;
    broadhash: string;
    minVersion: string;
    nonce: string;
}

export interface IConfigSync {
    peersTimeout: number;
    minBroadhashConsensus: number;
}

export class SyncRepo {
    headers: IHeaders;
    config: IConfigSync;
    messages: any = {};
    hashsum: string;
}
