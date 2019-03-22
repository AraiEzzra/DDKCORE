import { messageRPC } from 'shared/util/bus';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export class TransactionController {

    constructor() {
        this.createTransaction = this.createTransaction.bind(this);
    }

    @API(API_ACTION_TYPES.CREATE_TRANSACTION)
    public createTransaction(message: Message) {
        /**
         * Some validate "message.body"
         */

        messageRPC(API_ACTION_TYPES.CREATE_TRANSACTION, message.body);
        const responseMessage = 'TRANSACTION IS PENDING';
        return new ResponseEntity({ data: { message: responseMessage } });
    }
}

export default new TransactionController();

