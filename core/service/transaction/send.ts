import { IAssetService } from 'core/service/transaction';
import { TransactionModel } from 'shared/model/transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account, AccountChangeAction } from 'shared/model/account';
import { ResponseEntity } from 'shared/model/response';
import config from 'shared/config';
import AccountRepo from 'core/repository/account';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import BUFFER from 'core/util/buffer';

class TransactionSendService implements IAssetService<IAssetTransfer> {

    create(trs: TransactionModel<IAssetTransfer>): IAssetTransfer {
        return {
            recipientAddress: BigInt(trs.asset.recipientAddress),
            amount: trs.asset.amount,
        };
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

    validate(trs: Transaction<IAssetTransfer>): ResponseEntity<void> {
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

        return new ResponseEntity<void>({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account): ResponseEntity<void> {
        if ((trs.fee + trs.asset.amount) > sender.actualBalance) {
            return new ResponseEntity<void>({ errors: ['Not enough balance.'] });
        }
        return new ResponseEntity<void>();
    }

    calculateFee(trs: Transaction<IAssetTransfer>, sender: Account): number {
        return (trs.asset.amount * config.CONSTANTS.FEES.SEND) / TOTAL_PERCENTAGE;
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
        recipient.historify(AccountChangeAction.MONEY_RECEIVE, trs.id);
    }

    undoUnconfirmed(trs: Transaction<IAssetTransfer>, sender: Account, senderOnly: boolean): void {
        sender.actualBalance += trs.asset.amount;
        if (!senderOnly) {
            const recipient = AccountRepo.getByAddress(trs.asset.recipientAddress);
            recipient.actualBalance -= trs.asset.amount;
            recipient.historify(AccountChangeAction.MONEY_RECEIVE_UNDO, trs.id);
        }
    }

}

export default new TransactionSendService();
