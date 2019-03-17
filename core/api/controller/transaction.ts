import { messageON } from 'shared/util/bus';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';

export class TransactionController {

    @API('CREATE_TRANSACTION')
    public transactionCreate(message: Message) {
        /**
         * Some validate "message.body"
         */

        messageON('TRANSACTION_CREATE', message.body);

        const responseMessage = 'TRANSACTION IS PENDING';
        return new ResponseEntity({ data: { message: responseMessage } });
    }
}

export default new TransactionController();

