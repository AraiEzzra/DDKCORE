import { IAssetService } from '../transaction';
import {IAsset, TransactionModel} from 'shared/model/transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';
import { TOTAL_PERCENTAGE } from 'core/util/const';

class TransactionSendService implements IAssetService<IAssetTransfer> {

    create(trs: TransactionModel<IAssetTransfer>): void {
        return;
    }

    getBytes(trs: Transaction<IAssetTransfer>): Buffer {
        return Buffer.from([]);
    }

    verifyUnconfirmed(trs: Transaction<IAsset>): Response<void> {
        return new Response();
    }

    // TODO: validate fields in controller
    validate(trs: Transaction<IAssetTransfer>, sender: Account): Response<void> {
        const errors = [];

        return new Response();
    }

    calculateFee(trs: Transaction<IAssetTransfer>, sender: Account): number {
        return (trs.asset.amount * config.constants.fees.send) / TOTAL_PERCENTAGE;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): void {
        return;
    }

    applyUnconfirmed(trs: Transaction<IAssetTransfer>): void {
        const amount = trs.asset.amount + trs.fee;
        AccountRepo.updateBalanceByPublicKey(trs.senderPublicKey, -amount);
        AccountRepo.updateBalanceByAddress(trs.asset.recipientAddress, trs.asset.amount);
    }

    undoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): void {
        const amount = trs.asset.amount + trs.fee;
        AccountRepo.updateBalanceByPublicKey(trs.senderPublicKey, amount);
        AccountRepo.updateBalanceByAddress(trs.asset.recipientAddress, -trs.asset.amount);
    }

}

export default new TransactionSendService();
