import { ITransactionService } from '../transaction';
import { IAsset } from 'shared/model/transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';
import { ITableObject } from 'core/util/common';
import { TOTAL_PERCENTAGE } from 'core/util/const';

class TransactionSendService implements ITransactionService<IAssetTransfer> {

    async create(trs: Transaction<IAssetTransfer>): Promise<IAssetTransfer> {
        return;
    }

    getBytes(trs: Transaction<IAssetTransfer>): Buffer {
        return Buffer.from([]);
    }

    async verifyUnconfirmed(trs: Transaction<IAsset>): Promise<Response<void>> {
        return new Response();
    }

    // TODO: validate fields in controller
    async verify(trs: Transaction<IAssetTransfer>, sender: Account): Promise<Response<void>> {
        const errors = [];

        if (!trs.recipientAddress) {
            errors.push('Missing recipient address');
        }

        if (trs.amount <= 0) {
            errors.push('Invalid transaction amount');
        }

        return new Response();
    }

    calculateFee(trs: Transaction<IAsset>, sender: Account): number {
        return (trs.amount * config.constants.fees.send) / TOTAL_PERCENTAGE;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAsset>, sender: Account): void {
        return;
    }

    async applyUnconfirmed(trs: Transaction<IAsset>): Promise<Response<void>> {
        return AccountRepo.updateBalanceByAddress(trs.recipientAddress, trs.amount);
    }

    async undoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): Promise<Response<void>> {
        return null;
    }

    async apply(trs: Transaction<IAssetTransfer>): Promise<Response<void>> {
        return null;
    }

    async undo(trs: Transaction<IAssetTransfer>): Promise<Response<void>> {
        return null;
    }

    dbRead(fullBlockRow: Transaction<IAssetTransfer>): Transaction<IAssetTransfer> {
        return null;
    }

    dbSave(trs: Transaction<IAssetTransfer>): Array<ITableObject> {
        return null;
    }
}

export default new TransactionSendService();
