import { IAssetService } from '../transaction';
import { TransactionModel } from 'shared/model/transaction';
import { IAssetSignature, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { ResponseEntity } from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';

class TransactionSignatureService implements IAssetService<IAssetSignature> {

    create(trs: TransactionModel<IAssetSignature>): IAssetSignature {
        return {
            publicKey: trs.asset.publicKey,
        };
    }

    getBytes(trs: Transaction<IAssetSignature>): Buffer {
        return Buffer.from(trs.asset.publicKey, 'hex');
    }

    validate(trs: Transaction<IAssetSignature>): ResponseEntity<void> {
        const errors = [];

        if (!trs.asset) {
            errors.push('Missing asset');
            return new ResponseEntity<void>({ errors });
        }

        if (!trs.asset.publicKey) {
            errors.push('Missing second public key');
        }

        return new ResponseEntity<void>({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetSignature>, sender: Account): ResponseEntity<void> {
        const errors = [];
        if (sender.secondPublicKey) {
            errors.push('User already has second public key');
        }
        return new ResponseEntity<void>({ errors });
    }

    calculateFee(trs: Transaction<IAssetSignature>, sender: Account): number {
        return config.constants.fees.secondsignature;
    }

    applyUnconfirmed(trs: Transaction<IAssetSignature>, sender: Account): void {
        sender.secondPublicKey = trs.asset.publicKey;
    }

    undoUnconfirmed(trs: Transaction<IAssetSignature>, sender: Account, senderOnly): void {
        sender.secondPublicKey = null;
    }
}

export default new TransactionSignatureService();
