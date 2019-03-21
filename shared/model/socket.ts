export class SocketResponse {
    code: string;
    data: any;

    constructor(responseJSON: string) {
        const response: SocketResponse = JSON.parse(responseJSON);
        this.code = response.code;
        this.data = response.data;
    }
}

export class SocketResponseRPC extends SocketResponse {
    requestId: string;

    constructor(responseJSON: string) {
        super(responseJSON);
        const response: SocketResponseRPC = JSON.parse(responseJSON);
        this.requestId = response.requestId;
    }
}
