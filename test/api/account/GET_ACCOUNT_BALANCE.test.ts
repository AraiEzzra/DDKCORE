import { Fixture } from 'test/api/base/fixture';
import { Message2 } from 'shared/model/message';
import { expect } from 'chai';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getSocket } from 'test/api/base';


describe('Test GET_ACCOUNT_BALANCE', () => {

    it('Positive', (done) => {
        const RESPONSE = 4203000000000000;
        const HEADERS = Fixture.getBaseHeaders();
        const REQUEST = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
            body: { address: '4995063339468361088' }
        };

        const socket = getSocket();
        socket.emit('message', REQUEST);
        socket.on('message', (response: Message2<ResponseEntity<any>>) => {
            if (response.headers.id === HEADERS.id) {
                expect(response.body.success).to.equal(true);
                expect(response.body.data).to.equal(RESPONSE);
                socket.close();
                done();
            }
        });
    });

    it('Positive empty', (done) => {
        const HEADERS = Fixture.getBaseHeaders();
        const REQUEST = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
            body: { address: '4995063339468361089' }
        };

        const socket = getSocket();
        socket.emit('message', REQUEST);
        socket.on('message', (response: Message2<ResponseEntity<any>>) => {
            if (response.headers.id === HEADERS.id) {
                expect(response.body.success).to.equal(true);
                expect(response.body.data).to.equal(0);
                socket.close();
                done();
            }
        });
    });

    it('Negative validate', (done) => {
        const HEADERS = Fixture.getBaseHeaders();
        const REQUEST = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
            body: {}
        };

        const socket = getSocket();
        socket.emit('message', REQUEST);
        socket.on('message', (response: Message2<ResponseEntity<any>>) => {
            if (response.headers.id === HEADERS.id) {
                expect(response.body.success).to.equal(false);
                expect(response.body.errors).to.deep.equal(
                    ["IS NOT VALID REQUEST:'GET_ACCOUNT_BALANCE'... Missing required property: address"]
                );
                socket.close();
                done();
            }
        });
    });
});
