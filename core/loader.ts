// import db from 'shared/driver/db';
import TransactionService from 'core/service/transaction';
import { TransactionStatus, TransactionType} from 'shared/model/transaction';
import { Address, PublicKey, Timestamp} from 'shared/model/account';
import { messageON } from 'shared/util/bus';
import {initControllers} from 'core/controller/index';
enum constant  {
    Limit = 1000
}

interface ITransaction <T extends object> {
    id: string;
    blockId: string;
    type: TransactionType;
    senderPublicKey: PublicKey;
    senderAddress: Address;
    recipientAddress: Address;
    signature: string;
    secondSignature: string;
    amount: number;
    createdAt: Timestamp;
    fee: number;
    status?: TransactionStatus;
    asset: T;
}


class Loader {

    public async start() {
        // const totalAmountTrs = await db.one(`
        //     SELECT count(*)::int AS count
        //     FROM trs;
        // `);

        // const countIteration = Math.ceil(totalAmountTrs.count / constant.Limit);

        // for (let i = 0; i < countIteration; i ++ ) {
        //     const transactionBatch = await this.getTransactionBatch(constant.Limit * i);
        //     for (const trs of transactionBatch) {
        //         await TransactionService.applyUnconfirmed(trs);
        //     }
        // }
        initControllers();
        messageON('WARN_UP_FINISHED');
    }

    private async getTransactionBatch(offset: number): Promise<Array<ITransaction<any>>> {
        // const transactions: Array<ITransaction<any>> = await db.many(`
        //     SELECT *
        //     FROM trs
        //     ORDER BY created_at ASC
        //     LIMIT ${constant.Limit}
        //     OFFSET ${offset}
        // `);
        // return transactions;
        return [];
    }
}

export default new Loader();
