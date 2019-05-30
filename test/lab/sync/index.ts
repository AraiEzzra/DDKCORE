import Loader from 'core/loader';
import socketFactory from 'test/lab/utils/socket/client';
import testSocketServer from 'test/lab/utils/socket/testSocketServer';
import { SOCKET_EMIT_INTERVAL } from 'test/lab/config';

export const prepare = async (testName: string, methodA = null, methodB = null, methodRunner = null) => {
    const nodeName = process.env.NODE_NAME;
    if (nodeName === 'TEST_RUNNER') {
        if (methodRunner) {
            await methodRunner();
        }
        await testFunction(testName);
    } else {
        if (methodA && nodeName === 'NODE_A') {
            console.log('RUNNING PREPARE METHOD FOR: ', nodeName);
            await methodA();
        }

        if (methodB && nodeName === 'NODE_B') {
            console.log('RUNNING PREPARE METHOD FOR: ', nodeName);
            await methodB();
        }
        await socketRequest(testName, { node: nodeName });
    }
};

export const socketRequest = (testName: string, data: any) =>
    new Promise(resolve => {
        const socket = socketFactory.socketConnection;
        const timer = setInterval(() => socket.emit(testName, data), SOCKET_EMIT_INTERVAL);
        socket.emit(testName, data);
        socket.on(testName + '_RESPONSE', () => {
            clearInterval(timer);
            resolve();
        });
    });

export const prepareLoader = async () => {
    await Loader.start();
};

export const testFunction = async (testName: string) => {
    return new Promise(resolve => {
        const resultObj = new Map();
        testSocketServer.register(testName, (socket: any, response: any) => {
            console.log('RESPONSEEEE ', response);
            const peerName = response.node;
            resultObj.set(peerName, true);
            const resultCount = resultObj.size;
            socket.emit(testName + '_RESPONSE');
            if (resultCount === 2) {
                resolve();
            }
        });
    });
};
