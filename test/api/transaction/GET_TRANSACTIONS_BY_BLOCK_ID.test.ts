import { Fixture } from 'test/api/base/fixture';
import { Message2 } from 'shared/model/message';
import { expect } from 'chai';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getSocket } from 'test/api/base';
import { IAsset, SerializedTransaction } from 'shared/model/transaction';


describe('Test GET_TRANSACTIONS_BY_BLOCK_ID', () => {

    it('Positive', (done) => {
        const SUCCESS_TRANSACTIONS = [{
            id: '9e805d3e4efb5e371a1f48beb8a95e6144cfd57681a47a55043daf897ba466ea',
            blockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
            type: 10,
            confirmations: 0,
            createdAt: 0,
            senderPublicKey: 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
            senderAddress: '4995063339468361088',
            signature: 'a1e5da01e33df8501558bcb892050d8bf64dce442c5d5875b777b3e82fcfb339ea5ff6' +
                'a9b06adf0bd58fb7a866c5adde9561e903391b58e6c1992e711100a709',
            secondSignature: null,
            fee: 0,
            salt: '35a841ed3dc14886cd1757837908c8b3',
            asset: {
                recipientAddress: '933553974927686133',
                amount: 171000000000000
            }
        }, {
            id: 'c7d80bf1bb220e62735bd388549a87c0cd93b8be30a1ae2f7291ce20d2a94b79',
            blockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0',
            type: 10,
            confirmations: 0,
            createdAt: 0,
            senderPublicKey: '49a2b5e68f851a11058748269a276b0c0d36497215548fb40d4fe4e929d0283a',
            senderAddress: '12384687466662805891',
            signature: '226ed984bf3d82b7c332ce48bc976fcc35930d22cb068b2e9de993a4fb3e402d4bdb7077d0923b' +
                '8dd2c205e6a2473884752615c0787967b218143eec5df1390c',
            secondSignature: null,
            fee: 0,
            salt: 'a7fdae234eeb416e31f5f02571f54a0c',
            asset: {
                recipientAddress: '4995063339468361088',
                amount: 4500000000000000
            }
        }];
        const HEADERS = Fixture.getBaseHeaders();
        const SUCCESS_MESSAGE = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTIONS_BY_BLOCK_ID,
            body: {
                limit: 2,
                offset: 2,
                blockId: 'cbb9449abb9672d33fa2eb200b1c8b03db7c6572dfb6e59dc334c0ab82b63ab0'
            }
        };

        const socket = getSocket();
        socket.emit('message', SUCCESS_MESSAGE);
        socket.on('message',
            (response: Message2<ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>>
            ) => {
                if (response.headers.id === HEADERS.id) {
                    expect(response.body.success).to.equal(true);
                    expect(response.body.data.transactions).to.deep.equal(SUCCESS_TRANSACTIONS);
                    expect(response.body.data.count).to.equal(7);
                    socket.close();
                    done();
                }
            });
    });

    it('Negative', (done) => {
        const HEADERS = Fixture.getBaseHeaders();
        const FAILED_MESSAGE = {
            headers: HEADERS,
            code: API_ACTION_TYPES.GET_TRANSACTIONS_BY_BLOCK_ID,
            body: {
                limit: 2,
                offset: 2
            }
        };

        const socket = getSocket();
        socket.emit('message', FAILED_MESSAGE);
        socket.on('message',
            (response: Message2<ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>>
            ) => {
                if (response.headers.id === HEADERS.id) {
                    expect(response.body.success).to.equal(false);
                    expect(response.body.errors).to.deep.equal(
                        ['IS NOT VALID REQUEST:\'GET_TRANSACTIONS_BY_BLOCK_ID\'... Missing required property: blockId']
                    );
                    socket.close();
                    done();
                }
            });
    });
});


