import { NODE_NAME, SOCKET_EMIT_INTERVAL } from 'test/lab/config';
import { TEST_RUNNER_NAME } from 'test/lab/utils/constants';
import socketFactory from 'test/lab/utils/socket/client';
import testSocketServer from 'test/lab/utils/socket/testSocketServer';

export interface NetworkSynchronizer {

    syncAll(testStageName?: string): Promise<void>;

    syncTestRunnerNode(testStageName?: string): Promise<void>;

    syncPeerNode(testStageName?: string): Promise<void>;

}

export class NodesNetworkSynchronizer implements NetworkSynchronizer {

    private testName: string;

    constructor(testName: string) {
        this.testName = testName;
    }

    async syncAll(testStageName: string = this.testName): Promise<void> {
        NODE_NAME === TEST_RUNNER_NAME
            ? await this.syncTestRunnerNode(testStageName)
            : await this.syncPeerNode(testStageName);
    }

    syncPeerNode(testStageName: string = this.testName): Promise<void> {
        return new Promise(resolve => {
            const data = { node: NODE_NAME };
            const socket = socketFactory.socketConnection;
            const timer = setInterval(() => {
                socket.emit(testStageName, data);
            }, SOCKET_EMIT_INTERVAL);
            socket.on(testStageName, (response: any) => {
                clearInterval(timer);
                if (response.success) {
                    resolve();
                }
            });
            socket.emit(testStageName, data);
        });
    }

    syncTestRunnerNode(testStageName: string = this.testName): Promise<void> {
        return new Promise(resolve => {
            const peerResponses = new Map();
            testSocketServer.register(testStageName, (socket: any, response: any) => {
                const peerName = response.node;
                peerResponses.set(peerName, true);
                const resultCount = peerResponses.size;
                socket.emit(testStageName, { success: true });
                if (resultCount === 2) {
                    resolve();
                }
            });
        });
    }


}
