import { Fixture } from 'test/api/base/fixture';
import { Message2 } from 'shared/model/message';
import { expect } from 'chai';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getSocket } from 'test/api/base';
import { IAsset, SerializedTransaction } from 'shared/model/transaction';


describe('Test GET_TRANSACTIONS', () => {

    it('Positive', (done) => {
        const HEADERS = Fixture.getBaseHeaders();
        const GET_TRANSACTIONS_SUCCESS = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTIONS,
            body: {
                filter: { blockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0'},
                limit: 2,
                offset: 2,
                sort: [['createdAt', 'ASC']]
            }
        };

        const socket = getSocket();
        socket.emit('message', GET_TRANSACTIONS_SUCCESS);
        socket.on('message',
            (response: Message2<ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>>
            ) => {
                if (response.headers.id === HEADERS.id) {
                    expect(response.body.success).to.equal(true);
                    expect(response.body.data.count).to.equal(7);
                    expect(response.body.data.transactions[0]).to.haveOwnProperty('id');
                    expect(response.body.data.transactions[0]).to.haveOwnProperty('senderAddress');
                    socket.close();
                    done();
                }
            });
    });

    it('Negative', (done) => {
        const HEADERS = Fixture.getBaseHeaders();
        const GET_TRANSACTION_FAILED = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTIONS,
            body: {}
        };

        const socket = getSocket();
        socket.emit('message', GET_TRANSACTION_FAILED);
        socket.on('message',
            (response: Message2<ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>>
            ) => {
                if (response.headers.id === HEADERS.id) {
                    expect(response.body.success).to.equal(false);
                    expect(response.body.errors).to.deep.equal(
                        ['IS NOT VALID REQUEST:\'GET_TRANSACTIONS\'... Missing required property: offset']
                    );
                    socket.close();
                    done();
                }
            });
    });
});
