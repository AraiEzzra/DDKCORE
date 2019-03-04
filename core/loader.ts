import TransactionDispatcher from 'core/service/transaction';
import TransactionRepo from 'core/repository/transaction';
import AccountRepo from 'core/repository/account';
import {Transaction, IAsset} from 'shared/model/transaction';
import Response from 'shared/model/response';
import {messageON} from 'shared/util/bus';
import {initControllers} from 'core/controller';

const limit = 1000;

class Loader {
    public async start() {

        let offset = 0;
        do {
            const transactionBatch: Response<Array<Transaction<IAsset>>> =
                await TransactionRepo.getTransactionBatch(limit, offset);

            for (let trs of transactionBatch.data) {
                const sender = AccountRepo.add({
                    address: trs.senderAddress,
                    publicKey: trs.senderPublicKey
                });
                TransactionDispatcher.applyUnconfirmed(trs, sender.data);
            }
            if (transactionBatch.data.length < limit) {
                break;
            }
            offset += limit;
        } while (true);

        initControllers();
        messageON('WARM_UP_FINISHED', null);
    }
}

export default new Loader();
