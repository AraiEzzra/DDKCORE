import { messageON } from 'shared/util/bus';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { IAsset, TransactionModel } from 'shared/model/transaction';

export class TransactionController {


    constructor() {
        this.transactionCreate = this.transactionCreate.bind(this);
    }

    @API('CREATE_TRANSACTION')
    public transactionCreate(message: Message) {
        /**
         * Some validate "message.body"
         */

        console.log('MESSAGE: ', message);
        messageON('TRANSACTION_CREATE', message.body);

        const responseMessage = 'TRANSACTION IS PENDING';
        return new ResponseEntity({ data: { message: responseMessage } });
    }
}

export default new TransactionController();

