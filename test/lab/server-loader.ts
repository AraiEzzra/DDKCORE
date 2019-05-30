import { expect } from 'chai';
import { getSocketConnection } from 'test/lab/utils/socket/client';
import { testFunction } from 'test/lab/sync';

const synchronization: Map<string, boolean> = new Map();

describe('Sync test environment...', function () {
    this.timeout(50000);
    before(async () => {
        const nodeName = process.env.NODE_NAME;
        if (nodeName === 'TEST_RUNNER') {
            await testFunction();
        } else {
            const socketConnection = getSocketConnection();
            socketConnection.emit('sync', { node: nodeName, sync: true });
            const promise = new Promise(resolve => {
                socketConnection.on('SYNC_RESPONSE', () => {
                    resolve();
                });
            });
            await promise;
            console.log('EMITTING...', nodeName);
            socketConnection.emit('abc', { node: nodeName, test: 1 });
            const testPromise = new Promise(resolve => {
                socketConnection.on('abc_RESPONSE', () => console.log('WE CAN MOVE ON!'));
                resolve();
            });
            await testPromise;
        }
    });
    it('Sync test environment', () => {
        console.log('DONE!');
    });
});
