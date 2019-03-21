import { ON, RPC } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import { IAsset, TransactionModel } from 'shared/model/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionService from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import { Account } from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import TransactionRepo from 'core/repository/transaction';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { createKeyPairBySecret } from 'shared/util/crypto';

class TransactionController extends BaseController {
    @ON('TRANSACTION_RECEIVE')
    public async onReceiveTransaction(action: { data: { trs: TransactionModel<IAsset> } }): Promise<void> {
        const { data } = action;
        const trs = TransactionRepo.deserialize(data.trs);
        logger.debug(`[Controller][Transaction][onReceiveTransaction] ${JSON.stringify(data.trs)}`);

        if (!TransactionService.validate(trs)) {
            return;
        }

        if (TransactionPool.has(trs)) {
            return;
        }

        const sender: Account = AccountRepo.getByAddress(trs.senderAddress);
        if (!sender) {
            AccountRepo.add({
                publicKey: trs.senderPublicKey,
                address: trs.senderAddress
            });
        } else {
            sender.secondPublicKey = trs.senderPublicKey;
        }

        TransactionQueue.push(trs);
    }

    @RPC(API_ACTION_TYPES.CREATE_TRANSACTION)
    public async transactionCreate(action: { data: { trs: TransactionModel<IAsset>, secret: string } }): Promise<void> {
        console.log('TRANSACTION RPC CREATING....', JSON.stringify(action.data));

        const keyPair = createKeyPairBySecret(action.data.secret);
        const responseTrs = TransactionService.create(action.data.trs, keyPair);
        if (responseTrs.success) {
            TransactionQueue.push(responseTrs.data);
        }
    }

}

export default new TransactionController();
