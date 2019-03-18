import { messageRPC } from 'shared/util/bus';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';

export class TransactionController {

    constructor() {
        this.transactionCreate = this.transactionCreate.bind(this);
    }

    @API('CREATE_TRANSACTION')
    public transactionCreate(message: Message) {
        /**
         * Some validate "message.body"
         */

        messageRPC('TRANSACTION_CREATE', message.body);
        const responseMessage = 'TRANSACTION IS PENDING';
        return new ResponseEntity({ data: { message: responseMessage } });
    }
}

export default new TransactionController();

