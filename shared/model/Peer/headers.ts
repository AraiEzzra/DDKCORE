export type SerializedHeaders = {
    height: number;
    broadhash: string;
    peerCount: number;
};

export class Headers {
    private _height: number;
    private _broadhash: string;
    private _peerCount: number;

    constructor(headers: SerializedHeaders) {
        this._broadhash = headers.broadhash;
        this._height = headers.height;
        this._peerCount = headers.peerCount || 0;
    }


    get height(): number {
        return this._height;
    }

    set height(value: number) {
        this._height = value;
    }

    get broadhash(): string {
        return this._broadhash;
    }

    set broadhash(value: string) {
        this._broadhash = value;
    }

    get peerCount(): number {
        return this._peerCount;
    }

    set peerCount(value: number) {
        this._peerCount = value;
    }
    
    serialize(): SerializedHeaders {
        return {
            height: this._height,
            broadhash: this._broadhash,
            peerCount: this._peerCount,
        };
    }
    
    static deserialize(data: SerializedHeaders): Headers {
        return new Headers(data);
    }
}
