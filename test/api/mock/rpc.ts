import { RPC } from 'api/utils/decorators';

export class MockDecoratorRPC {

    @RPC('GET_ARRAY')
    getArray() {
        return [ 1, 2, 3];
    }

    @RPC('GET_STRING')
    getString() {
        return 'Hello';
    }
}
