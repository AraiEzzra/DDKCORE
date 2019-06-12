import { ON } from 'core/util/decorator';
import { BaseController } from 'core/controller/baseController';
import { logger } from 'shared/util/logger';
import { IAsset, SerializedTransaction } from 'shared/model/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionService from 'core/service/transaction';
import TransactionPool from 'core/service/transactionPool';
import { Account } from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import SharedTransactionRepo from 'shared/repository/transaction';
import { createKeyPairBySecret } from 'shared/util/crypto';
import { ResponseEntity } from 'shared/model/response';
import { CreateTransactionParams } from 'core/controller/types';
import config from 'shared/config';
import { ActionTypes } from 'core/util/actionTypes';

class TransactionController extends BaseController {

    @ON(ActionTypes.TRANSACTION_RECEIVE)
    public onReceiveTransaction({ data } : { data: { trs: SerializedTransaction<IAsset> } }): void {
        const trs = SharedTransactionRepo.deserialize(data.trs);
        const validateResult = TransactionService.validate(trs);
        if (!validateResult.success) {
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
        } else if (!sender.publicKey) {
            sender.publicKey = trs.senderPublicKey;
        }

        TransactionQueue.push(trs);
    }

    // TODO: extract this somewhere and make it async
    public transactionCreate(data: CreateTransactionParams) {
        if (config.CORE.IS_DISABLED_TRANSACTION_CREATION) {
            return new ResponseEntity({ errors: ['Transaction creation on core is disabled'] });
        }

        const keyPair = createKeyPairBySecret(data.secret);
        const secondKeyPair = data.secondSecret ? createKeyPairBySecret(data.secondSecret) : undefined;

        const responseTrs = TransactionService.create(data.trs, keyPair, secondKeyPair);
        if (responseTrs.success) {
            const validateResult = TransactionService.validate(responseTrs.data);
            if (!validateResult.success) {
                logger.debug(
                    `[RPC][TransactionController][transactionCreate] Validation of ${responseTrs.data} failed`
                );
                return new ResponseEntity({ errors: validateResult.errors });
            }
            TransactionQueue.push(responseTrs.data);
            return new ResponseEntity({ data: SharedTransactionRepo.serialize(responseTrs.data) });
        }
    }

}

export default new TransactionController();
