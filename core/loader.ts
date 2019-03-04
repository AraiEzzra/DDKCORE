import path from 'path';
import db from 'shared/driver/db';
import { QueryFile } from 'pg-promise';
import TransactionDispatcher from 'core/service/transaction';
import TransactionPGRepo from 'core/repository/transaction/pg';
import AccountRepo from 'core/repository/account';
import { IAsset, Transaction } from 'shared/model/transaction';
import { messageON } from 'shared/util/bus';
import { initControllers } from 'core/controller';

const limit = 1000;

class Loader {
    public async start() {
        const pathMockData: string = path.join(process.cwd(), 'core/database/sql');
        const filePath = path.join(pathMockData, 'init.sql');
        await db.query(new QueryFile(filePath, { minify: true }));

        let offset = 0;
        do {
            const transactionBatch: Array<Transaction<IAsset>> =
                await TransactionPGRepo.getMany(limit, offset);

            for (let trs of transactionBatch) {
                const sender = AccountRepo.add({
                    address: trs.senderAddress,
                    publicKey: trs.senderPublicKey
                });
                TransactionDispatcher.applyUnconfirmed(trs, sender.data);
            }
            if (transactionBatch.length < limit) {
                break;
            }
            offset += limit;
        } while (true);

        initControllers();
        messageON('WARM_UP_FINISHED', null);
    }
}

export default new Loader();
