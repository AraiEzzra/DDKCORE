import { IAssetService } from '../transaction';
import { IAssetTransfer, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import ResponseEntity from 'shared/model/response';
import config from 'shared/util/config';

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

    calculateFee(trs: Transaction<IAssetTransfer>, sender: Account): number {
        return (trs.amount * config.constants.fees.send) / 100;
    }

    calcUndoUnconfirmed(asset: IAssetTransfer, sender: Account): void {
        return null;
    }

    applyUnconfirmed(asset: IAssetTransfer): Promise<void> {
        return null;
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
