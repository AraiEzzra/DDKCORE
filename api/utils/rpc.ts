import { RPCConnector } from 'shared/util/rpc';
import { RPC_METHODS } from 'api/middleware/rpcHolder';

export class ApiRPC {
    public connection;

    constructor(host?: string, port?: number) {
        this.connection = new RPCConnector();
        this.connection.initServer(host, port);
        this.listenRPC();
    }

    listenRPC() {
        const listReq = Object.keys(RPC_METHODS);
        for (let i = 0; i < listReq.length; i++) {
            this.connection.register(listReq[i], RPC_METHODS[listReq[i]]);
        }
    }
}
