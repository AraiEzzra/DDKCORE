import { IAssetService } from '../transaction';
import { IAsset, TransactionModel } from 'shared/model/transaction';
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
            BUFFER.LENGTH.INT64 + // recipientAddress
            BUFFER.LENGTH.INT64  // amount
        );
        let offset = BUFFER.writeUInt64LE(buff, trs.asset.recipientAddress, 0);
        BUFFER.writeUInt64LE(buff, trs.asset.amount, offset);
        return buff;
    }

    validate(trs: Transaction<IAssetTransfer>): Response<void> {
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

    verifyUnconfirmed(trs: Transaction<IAsset>, sender: Account): Response<void> {
        return new Response();
    }

    calculateFee(trs: Transaction<IAssetTransfer>, sender: Account): number {
        return (trs.asset.amount * config.constants.fees.send) / TOTAL_PERCENTAGE;
    }

    applyUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): void {
        sender.actualBalance -= trs.asset.amount;
        let recipient = AccountRepo.getByAddress(trs.asset.recipientAddress);
        if (!recipient) {
            recipient = AccountRepo.add({
                address: trs.asset.recipientAddress
            });
        }
        recipient.actualBalance += trs.asset.amount;
    }

    undoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account, senderOnly): void {
        sender.actualBalance += trs.asset.amount;
        if (!senderOnly) {
            const recipient = AccountRepo.getByAddress(trs.asset.recipientAddress);
            recipient.actualBalance -= trs.asset.amount;
        }
    }

}

export default new TransactionSendService();
