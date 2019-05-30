import Loader from 'core/loader';
import { getSocketConnection } from 'test/lab/utils/socket/client';
import { TestSocketServer } from 'test/lab/utils/socket/testSocketServer';
import { TEST_SOCKET_SERVER_CONFIG } from 'test/lab/utils/socket/config';

export const prepare = async (testName: string, methodA = null, methodB = null, methodRunner = null) => {
    const nodeName = process.env.NODE_NAME;
    if (methodRunner && nodeName === 'TEST_RUNNER') {
        await methodRunner();
        // TODO: wait for server
    } else {
        if (methodA && nodeName === 'NODE_A') {
            await methodA();
        }

        if (methodB && nodeName === 'NODE_B') {
            await methodB();
        }

        await socketRequest(testName);
    }
};

export const socketRequest = (testName: string) =>
    new Promise(resolve => {
        const socket = getSocketConnection();
        socket.emit(testName);
        socket.on(testName + '_RESPONSE', () => resolve());
    });

export const prepareLoader = async () => {
    await Loader.start();
};

export const testFunction = async () => {
    const testSocketServer = new TestSocketServer(4000, TEST_SOCKET_SERVER_CONFIG);
    await testSocketServer.run();
    const resultObj = new Map();

    // console.log('BINDING...');
    // testSocketServer.on('abc', (response: any) => {
    //     console.log('RESPONSEEEE ', response);
    //     const peerName = response.node;
    //     resultObj.set(peerName, true);
    //     const result = [...resultObj.values()];
    //     // if (result.length && result.length === 2) {
    //     //     resolve();
    //     // }
    // });

};
