import { RPC } from 'api/utils/decorators';
import { Message } from 'shared/model/message';
import SocketMiddleware from 'api/middleware/socket';
import { GET_ACTIVE_DELEGATES, GET_INACTIVE_DELEGATES } from 'shared/driver/socket/codes';

export class DelegateController {

    constructor() {
        this.getActiveDelegates = this.getActiveDelegates.bind(this);
        this.getInactiveDelegates = this.getInactiveDelegates.bind(this);
    }

// TODO: Add validation of request
    @RPC(GET_ACTIVE_DELEGATES)
    getActiveDelegates(message: Message, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(GET_INACTIVE_DELEGATES)
    getInactiveDelegates(message: Message, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

}

export default new DelegateController();
