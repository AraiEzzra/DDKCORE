import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import { Transaction } from 'shared/model/transaction';
import transactionQueue from 'core/service/transactionQueue';

class TransactionController extends BaseController {

    @ON('TRANSACTION_RECEIVE')
    public async onReceiveTransaction(action: { data: { transaction: Transaction<any> } }): Promise<void> {
         const { data } = action;
        logger.debug(`[Controller][Transaction][onReceiveTransaction] ${JSON.stringify(data.transaction)}`);
        transactionQueue.push(data.transaction);
    }
}
