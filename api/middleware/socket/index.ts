import { RPC_METHODS } from 'api/middleware/rpcHolder';
import RewardControllerInstance, { RewardController } from 'api/controller/reward';
import ReferredUsersControllerInstance, { ReferredUsersController } from 'api/controller/referredUsers';
import AccountControllerInstance, { AccountController } from 'api/controller/account';
import DelegateControllerInstance, { DelegateController } from 'api/controller/delegate';
import { Message, MessageType } from 'shared/model/message';
import ResponseEntity from 'shared/model/response';
import { MESSAGE_CHANNEL } from 'api/driver/socket/channel';

export class SocketMiddleware {

    private rewardController: RewardController;
    private referredUsersController: ReferredUsersController;
    private accountController: AccountController;
    private delegateController: DelegateController;

    private requests: Map<string, any>;

    constructor() {
        this.rewardController = RewardControllerInstance;
        this.referredUsersController = ReferredUsersControllerInstance;
        this.accountController = AccountControllerInstance;
        this.delegateController = DelegateControllerInstance;
        this.requests = new Map<string, any>();
    }

    onAPIMessage(message: Message, socketApi: any) {
        const { headers } = message;
        if (headers.type === MessageType.RESPONSE || headers.type === MessageType.EVENT) {
            message.body = new ResponseEntity({ errors: ['Invalid message type'] });
            socketApi.emit(MESSAGE_CHANNEL, message);
        } else {
            this.requests.set(headers.id, socketApi);
            this.processMessage(message, socketApi);
        }
    }

    onCoreMessage(data: Message) {
        const requestId = data.headers.id;
        if (this.requests.has(requestId)) {
            const socket = this.requests.get(requestId);
            socket.emit(MESSAGE_CHANNEL, data);
            this.requests.delete(requestId);
        }
    }

    processMessage(message: Message, socketApi: any) {
        const method = RPC_METHODS[message.code];
        if (typeof method === 'function') {
            method(message, socketApi);
        } else {
            const errors = new ResponseEntity({ errors: ['Invalid request'] });
            const errorMessage = new Message(MessageType.RESPONSE, message.code, errors, message.headers.id);
            socketApi.emit(MESSAGE_CHANNEL, errorMessage);
        }
    }
}

export default new SocketMiddleware();
