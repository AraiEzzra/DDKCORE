import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import { Transaction, TransactionModel, IAsset } from 'shared/model/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';

class TransactionController extends BaseController {
    @ON('TRANSACTION_RECEIVE')
    public async onReceiveTransaction(action: { data: { trs: TransactionModel<IAsset> } }): Promise<void> {
        const { data } = action;
        logger.debug(`[Controller][Transaction][onReceiveTransaction] ${JSON.stringify(data.trs)}`);

        if (!TransactionDispatcher.verify(data.trs)) {
            return;
        }

        const trs = new Transaction(data.trs);

        if (TransactionPool.has(trs)) {
            return;
        }

        TransactionQueue.push(trs);
    }
}

export default new TransactionController();
