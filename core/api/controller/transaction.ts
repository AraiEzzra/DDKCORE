import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { getAddressByPublicKey } from 'shared/util/account';
import { logger } from 'shared/util/logger';
import TransactionRPCController from 'core/controller/transaction';
import TransactionQueue from 'core/service/transactionQueue';
import { ResponseEntity } from 'shared/model/response';
import SharedTransactionRepo from 'shared/repository/transaction';
import { SerializedTransaction } from 'shared/model/transaction';
import TransactionService from 'core/service/transaction';
import AccountRepo from 'core/repository/account';

export class TransactionController {

    constructor() {
        this.createTransaction = this.createTransaction.bind(this);
        this.createPreparedTransaction = this.createPreparedTransaction.bind(this);
    }

    @API(API_ACTION_TYPES.CREATE_TRANSACTION)
    public createTransaction(message: Message2<any>) {
        return TransactionRPCController.transactionCreate(message.body);
    }

    @API(API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION)
    public createPreparedTransaction(message: Message2<SerializedTransaction<any>>) {
        logger.trace(`[API][TransactionController][createPreparedTransaction] ${JSON.stringify(message.body)}`);

        const transaction = SharedTransactionRepo.deserialize(message.body);

        const validateResult = TransactionService.validate(transaction);
        if (!validateResult.success) {
            logger.debug(
                `[RPC][TransactionController][createPreparedTransaction]Validation of ${transaction.id} failed`
            );
            return new ResponseEntity({ errors: validateResult.errors });
        }

        transaction.senderAddress = transaction.senderAddress
            ? BigInt(transaction.senderAddress)
            : getAddressByPublicKey(transaction.senderPublicKey);

        let sender = AccountRepo.getByAddress(transaction.senderAddress);
        if (!sender) {
            sender = AccountRepo.add({
                address: transaction.senderAddress,
                publicKey: transaction.senderPublicKey
            });
        } else {
            sender.publicKey = transaction.senderPublicKey;
        }

        TransactionQueue.push(transaction);
        return new ResponseEntity({ data: SharedTransactionRepo.serialize(transaction) });
    }
}

export default new TransactionController();
