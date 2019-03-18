import { messageON } from 'shared/util/bus';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { logger } from 'shared/util/logger';

export class TransactionController {

    @API('TRANSACTION_CREATE')
    public transactionCreate(message: Message): void {
        /**
         * Some validate
         */
        messageON('TRANSACTION_CREATE', message.body);
        logger.info('[ CORE | API ]: EVENT "TRANSACTION_CREATE" ADDED TO BUS');
    }
}

export default new TransactionController();

