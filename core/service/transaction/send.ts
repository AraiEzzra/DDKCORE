import { IAssetService } from '../transaction';
import { IAsset, TransactionModel, TransactionType } from 'shared/model/transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import BUFFER from 'core/util/buffer';

class TransactionSendService implements IAssetService<IAssetTransfer> {

    create(trs: TransactionModel<IAssetTransfer>): void {
        return;
    }

    getBytes(trs: Transaction<IAssetTransfer>): Buffer {
        const buff = Buffer.alloc(
            BUFFER.LENGTH.INT64, // recipientAddress
            BUFFER.LENGTH.INT64  // amount
        );
        let offset = BUFFER.writeUInt64LE(buff, trs.asset.recipientAddress, 0);
        BUFFER.writeUInt64LE(buff, trs.asset.amount, offset);
        return buff;
    }

    validate(trs: Transaction<IAssetTransfer>, sender: Account): Response<void> {
        const errors = [];

        const asset: IAssetTransfer = <IAssetTransfer><Object>trs.asset;
        if (!asset.amount) {
            errors.push(`Missing amount`);
        }

        if (asset.amount < 0 ||
            String(asset.amount).indexOf('.') >= 0 ||
            asset.amount.toString().indexOf('e') >= 0
        ) {
            errors.push('Invalid amount');
        }

        return new Response({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAsset>): Response<void> {
        // TODO checkBalance
        return new Response();
    }

    calculateFee(trs: Transaction<IAssetTransfer>, sender: Account): number {
        return (trs.asset.amount * config.constants.fees.send) / TOTAL_PERCENTAGE;
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
