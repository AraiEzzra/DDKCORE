import { Fixture } from 'test/api/base/fixture';
import { Message2 } from 'shared/model/message';
import { expect } from 'chai';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getSocket } from 'test/api/base';


describe('Test GET_TRANSACTION', () => {

    it('Positive', (done) => {
        const SUCCESS_TRANSACTION = {
            'id': '2c52682e6a51a9ddfd48a679a95c9fea4e693790aec5968535a482088b6c75bf',
            'blockId': 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
            'type': 10,
            'createdAt': 0,
            'senderPublicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            'senderAddress': '4995063339468361088',
            'signature': 'dfe6697977493108a37dfd2727c85bd88d8aaf062973bdf6e4b99dd024a251e91319267b0e6e51731fa3' +
                '2ffd89b160d93a4bbd59f0c129bc669598b522da8000',
            'secondSignature': null,
            'fee': 0,
            'salt': '6f5b997e54d3f6a249d9be019814a66a',
            'asset': { 'recipientAddress': '7897332094363171058', 'amount': 90000000000000 }
        };
        const GET_TRANSACTION_SUCCESS_HEADERS = Fixture.getBaseHeaders();
        const GET_TRANSACTION_SUCCESS = {
            headers: GET_TRANSACTION_SUCCESS_HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTION,
            body: {
                id: '2c52682e6a51a9ddfd48a679a95c9fea4e693790aec5968535a482088b6c75bf',
            }
        };

        const socket = getSocket();
        socket.emit('message', GET_TRANSACTION_SUCCESS);
        socket.on('message', (response: Message2<ResponseEntity<any>>) => {
            if (response.headers.id === GET_TRANSACTION_SUCCESS_HEADERS.id) {
                expect(response.body.success).to.equal(true);
                expect(response.body.data).to.deep.equal(SUCCESS_TRANSACTION);
                socket.close();
                done();
            }
        });
    });

    it('Negative', (done) => {
        const GET_TRANSACTION_FAILED_HEADERS = Fixture.getBaseHeaders();
        const GET_TRANSACTION_FAILED = {
            headers: GET_TRANSACTION_FAILED_HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTION,
            body: {}
        };

        const socket = getSocket();
        socket.emit('message', GET_TRANSACTION_FAILED);
        socket.on('message', (response: Message2<ResponseEntity<any>>) => {
            if (response.headers.id === GET_TRANSACTION_FAILED_HEADERS.id) {
                expect(response.body.success).to.equal(false);
                expect(response.body.errors).to.deep.equal(
                    ['IS NOT VALID REQUEST:\'GET_TRANSACTION\'... Missing required property: id']
                );
                socket.close();
                done();
            }
        });
    });
});
