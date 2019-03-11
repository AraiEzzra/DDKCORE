import { IAssetService } from '../transaction';
import { TransactionModel } from 'shared/model/transaction';
import { IAssetSignature, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import config from 'shared/util/config';
import AccountRepo from '../../repository/account';

class TransactionSendService implements IAssetService<IAssetSignature> {

    create(trs: TransactionModel<IAssetSignature>): void {
        return;
    }

    getBytes(trs: Transaction<IAssetSignature>): Buffer {
        return Buffer.from(trs.asset.publicKey, 'hex');
    }

    validate(trs: Transaction<IAssetSignature>): Response<void> {
        const errors = [];

        if (!trs.asset) {
            errors.push('Missing asset');
            return new Response<void>({ errors });
        }

        if (!trs.asset.publicKey) {
            errors.push('Missing second public key');
        }

        return new Response<void>({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetSignature>, sender: Account): Response<void> {
        const errors = [];
        if (sender.secondPublicKey) {
            errors.push('User already has second public key');
        }
        return new Response<void>({ errors });
    }

    calculateFee(trs: Transaction<IAssetSignature>, sender: Account): number {
        return config.constants.fees.secondsignature;
    }

    applyUnconfirmed(trs: Transaction<IAssetSignature>, sender: Account): void {
        AccountRepo.updateSecondPublicKey(trs.senderAddress, trs.asset.publicKey);
    }

    undoUnconfirmed(trs: Transaction<IAssetSignature>, sender: Account, senderOnly): void {
        AccountRepo.updateSecondPublicKey(trs.senderAddress, null);
    }
}

export default new TransactionSendService();
