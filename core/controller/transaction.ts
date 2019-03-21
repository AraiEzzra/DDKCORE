import { ON, RPC } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import { IAsset, TransactionModel } from 'shared/model/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionService from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import { Account } from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import { ed } from 'shared/util/ed';
import TransactionRepo from 'core/repository/transaction';

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

    @RPC('TRANSACTION_CREATE')
    public async transactionCreate(data: { trs: TransactionModel<IAsset>, secret: string }): Promise<void> {
        console.log('TRANSACTION RPC CREATING....', data.trs.type);
        const keyPair = ed.makeKeyPair(Buffer.from(data.secret));
        const responseTrs = TransactionService.create(data.trs, keyPair);
        if (responseTrs.success) {
            TransactionQueue.push(responseTrs.data);
        }
    }

}

export default new TransactionController();
