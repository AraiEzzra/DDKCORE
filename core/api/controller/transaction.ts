import { messageON } from 'shared/util/bus';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';

export class TransactionController {

    @API('TRANSACTION_CREATE')
    public transactionCreate(message: Message): any {
        /**
         * Some validate "message.body"
         */
        messageON('TRANSACTION_CREATE', message.body);
        return true;
    }
}

export default new TransactionController();

