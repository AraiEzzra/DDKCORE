import { ITransactionService } from '../transaction';
import { IAsset } from 'shared/model/transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';
import { TOTAL_PERCENTAGE } from 'core/util/const';

class TransactionSendService implements ITransactionService<IAssetTransfer> {

    create(trs: Transaction<IAssetTransfer>): IAssetTransfer {
        return;
    }

    getBytes(trs: Transaction<IAssetTransfer>): Buffer {
        return Buffer.from([]);
    }

    verifyUnconfirmed(trs: Transaction<IAsset>): Response<void> {
        return new Response();
    }

    // TODO: validate fields in controller
    verify(trs: Transaction<IAssetTransfer>, sender: Account): Response<void> {
        const errors = [];

        if (!trs.recipientAddress) {
            errors.push('Missing recipient address');
        }

        if (trs.amount <= 0) {
            errors.push('Invalid transaction amount');
        }

        return new Response();
    }

    calculateFee(trs: Transaction<IAssetTransfer>, sender: Account): number {
        return (trs.amount * config.constants.fees.send) / TOTAL_PERCENTAGE;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): void {
        return;
    }

    applyUnconfirmed(trs: Transaction<IAssetTransfer>): Response<void> {
        return AccountRepo.updateBalanceByAddress(trs.recipientAddress, trs.amount);
    }

    undoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): Response<void> {
        return null;
    }

    async apply(trs: Transaction<IAssetTransfer>): Promise<Response<void>> {
        return null;
    }

    async undo(trs: Transaction<IAssetTransfer>): Promise<Response<void>> {
        return null;
    }
}

export default new TransactionSendService();
