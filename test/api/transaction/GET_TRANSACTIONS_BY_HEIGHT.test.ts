import { Fixture } from 'test/api/base/fixture';
import { Message } from 'shared/model/message';
import { expect } from 'chai';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getSocket } from 'test/api/base';
import { IAsset, SerializedTransaction } from 'shared/model/transaction';
import config from 'shared/config';


describe('Test GET_TRANSACTIONS_BY_HEIGHT', () => {

    it('Positive', (done) => {
        const SUCCESS_TRANSACTIONS = [
            {
                id: '1b2b528f674a47ccfb95376b61358ddca088c60697ccda48c8116da0ff9cd997',
                blockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
                type: 10,
                createdAt: 0,
                relay: 0,
                senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                senderAddress: '4995063339468361088',
                signature: '24327b2214249fadd07f1b1487be40a69deb73d03908726e4e4d880b75b7c9cc541ff8' +
                    'c69253308213a1ad2cee3879fec6ce569c29bade6d3d390e8e61e40207',
                secondSignature: null,
                fee: 10000000,
                salt: '8396e8c4472f12ccb7d60a1e10392bee',
                confirmations: 0,
                asset:
                    {
                        recipientAddress: '3995920038576041585',
                        amount: 100000000000
                    }
            },
            {
                id: '2c52682e6a51a9ddfd48a679a95c9fea4e693790aec5968535a482088b6c75bf',
                blockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
                type: 10,
                createdAt: 0,
                relay: 0,
                senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                senderAddress: '4995063339468361088',
                signature: 'dfe6697977493108a37dfd2727c85bd88d8aaf062973bdf6e4b99dd024a251e91319267b0e' +
                    '6e51731fa32ffd89b160d93a4bbd59f0c129bc669598b522da8000',
                secondSignature: null,
                fee: 0,
                salt: '6f5b997e54d3f6a249d9be019814a66a',
                confirmations: 0,
                asset:
                    {
                        recipientAddress: '7897332094363171058',
                        amount: 90000000000000
                    }
            }];
        const HEADERS = Fixture.getBaseHeaders();
        const SUCCESS_MESSAGE = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTIONS_BY_HEIGHT,
            body: {
                limit: 2,
                offset: 3,
                height: 1
            }
        };

        const socket = getSocket();
        socket.emit('message', SUCCESS_MESSAGE);
        socket.on('message',
            (response: Message<ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>>
            ) => {
                if (response.headers.id === HEADERS.id) {
                    expect(response.body.success).to.equal(true);
                    expect(response.body.data.transactions).to.deep.equal(SUCCESS_TRANSACTIONS);
                    expect(response.body.data.count).to.equal(config.GENESIS_BLOCK.transactions.length);
                    socket.close();
                    done();
                }
            });
    });

    it('Negative', (done) => {
        const HEADERS = Fixture.getBaseHeaders();
        const FAILED_MESSAGE = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTIONS_BY_HEIGHT,
            body: {
                limit: 2,
                offset: 2
            }
        };

        const socket = getSocket();
        socket.emit('message', FAILED_MESSAGE);
        socket.on('message',
            (response: Message<ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>>
            ) => {
                if (response.headers.id === HEADERS.id) {
                    expect(response.body.success).to.equal(false);
                    expect(response.body.errors).to.deep.equal(
                        ['IS NOT VALID REQUEST:\'GET_TRANSACTIONS_BY_HEIGHT\'... Missing required property: height']
                    );
                    socket.close();
                    done();
                }
            });
    });
});
