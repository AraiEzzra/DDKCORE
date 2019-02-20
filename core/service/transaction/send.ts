import { IAssetService } from '../transaction';
import { IAsset } from 'shared/model/transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import ResponseEntity from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';

class TransactionSendService implements IAssetService<IAssetTransfer> {
    create(trs: Transaction<{}>): IAssetTransfer {
        const asset: IAssetTransfer = {
            recipientAddress: trs.recipientAddress,
        };

        return asset;
    }

    getBytes(asset: IAssetTransfer): Uint8Array {
        return Buffer.from([]);
    }

    verifyUnconfirmed(trs: Transaction<IAsset>): ResponseEntity<void> {
        return new ResponseEntity();
    }

    verify(trs: Transaction<IAssetTransfer>, sender: Account): ResponseEntity<any> {
        const errors = [];

        if (!trs.recipientAddress) {
            errors.push('Missing recipient address');
        }

        if (trs.amount <= 0) {
            errors.push('Invalid transaction amount');
        }

        return new ResponseEntity({ errors });
    }

    calculateFee(trs: Transaction<IAsset>, sender: Account): number {
        return (trs.amount * config.constants.fees.send) / 100;
    }

    calcUndoUnconfirmed(trs: Transaction<IAsset>, sender: Account): void {
        return;
    }

    applyUnconfirmed(trs: Transaction<IAsset>): ResponseEntity<void> {
        return AccountRepo.updateBalanceByAddress(trs.recipientAddress, trs.amount);
    }

    undoUnconfirmed(asset: IAssetTransfer): Promise<void> {
        return null;
    }

    apply(asset: IAssetTransfer): Promise<void> {
        return null;
    }

    undo(asset: IAssetTransfer): Promise<void> {
        return null;
    }

    dbRead(fullTrsObject: any): IAssetTransfer {
        return null;
    }

    dbSave(asset: IAssetTransfer): Promise<void> {
        return null;
    }
}

export default new TransactionSendService();
