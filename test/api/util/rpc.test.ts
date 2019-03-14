import { ApiRPC } from 'api/utils/rpc';
import { RPCConnector } from 'shared/util/rpc';
import { expect } from 'chai';
import { MockDecoratorRPC } from '../mock/rpc';

describe('Test RPC decorator. ', () => {

    const port = 8103;
    const host = 'localhost';
    let rpcClient;
    let rpcServer;
    let conn;

    before((done) => {

        const mock = new MockDecoratorRPC();
        /**
         * Connect RPC
         */
        const apiRPC = new ApiRPC(host, port);
        rpcServer = apiRPC.connection.getRPCServer();

        conn = new RPCConnector();
        conn.initClient(host, port);

        rpcClient = conn.getRPCClient();
        done();
    });

    it('Should be return a string',  (done) => {
        let result: string;
        try {
            rpcClient.on('open', async () => {
                /**
                 * Call from RPC
                 */
                result = await rpcClient.call('GET_STRING');
                expect(result).to.be.a('string');
                expect(result).to.be.equal('Hello');
                done();

                return;
            });
        } catch (e) {}
    });


    it('Should be return a array',  async () => {
        let result: Array<number>;
        try {
            result = await rpcClient.call('GET_ARRAY');
            expect(result).to.be.a('array');
            return;
        } catch (e) {}
    });

    after((done) => {
        conn.disconnectRPC();
        done();
    });
});

