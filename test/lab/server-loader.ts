import { expect } from 'chai';
import { getSocketConnection } from 'test/lab/utils/socket/client';
import { socketRequest, testFunction } from 'test/lab/sync';
import testSocketServer from 'test/lab/utils/socket/testSocketServer';
import socketFactory from 'test/lab/utils/socket/client';
import { DEFAULT_TEST_TIMEOUT } from 'test/lab/config';

const synchronization: Map<string, boolean> = new Map();

describe('Sync test environment...', function () {
    this.timeout(DEFAULT_TEST_TIMEOUT);
    before(async () => {
        const nodeName = process.env.NODE_NAME;
        if (nodeName === 'TEST_RUNNER') {
            await testSocketServer.run();
            await testFunction('abc');
        } else {
            const socketConnection = socketFactory.socketConnection;
            socketConnection.emit('sync', { node: nodeName, sync: true });
            const promise = new Promise(resolve => {
                socketConnection.on('SYNC_RESPONSE', () => {
                    resolve();
                });
            });
            await promise;
            console.log('EMITTING...', nodeName);
            await socketRequest('abc', { node: nodeName });
        }
    });
    it('Sync test environment', () => {
        console.log('DONE!');
    });
});
