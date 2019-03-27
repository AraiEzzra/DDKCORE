import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { logger } from 'shared/util/logger';
import TransactionRPCController from 'core/controller/transaction';

export class TransactionController {

    constructor() {
        this.createTransaction = this.createTransaction.bind(this);
    }

    @API(API_ACTION_TYPES.CREATE_TRANSACTION)
    public createTransaction(message: Message) {
        /**
         * Some validate "message.body"
         */
        logger.debug(`[API][TransactionController][createTransaction] ${JSON.stringify(message.body)}`);
        return TransactionRPCController.transactionCreate(message.body);
    }
}

export default new TransactionController();

