import { IAssetService } from 'core/service/transaction';
import {IAssetDelegate, Transaction, TransactionModel} from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { Delegate } from 'shared/model/delegate';
import DelegateRepo from 'core/repository/delegate';
import { ResponseEntity } from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';

class TransactionDelegateService implements IAssetService<IAssetDelegate> {

    create(trs: TransactionModel<IAssetDelegate>): IAssetDelegate {
        return {
            username: trs.asset.username.toLowerCase().trim(),
            url: trs.asset.url,
        };
    }

    getBytes(trs: Transaction<IAssetDelegate>): Buffer {
        return Buffer.from(trs.asset.username, 'utf8');
    }

    validate(trs: Transaction<IAssetDelegate>): ResponseEntity<void> {
        const errors = [];

        if (!trs.asset || !trs.asset.username) {
            errors.push('Invalid transaction asset');
        }

        if (trs.asset.username !== trs.asset.username.toLowerCase()) {
            errors.push('Username must be lowercase');
        }

        const isAddress = /^[0-9]{1,25}$/ig;
        const allowSymbols = /^[a-z0-9!@$&_.]+$/g;

        const username = String(trs.asset.username)
            .toLowerCase()
            .trim();

        if (username === '') {
            errors.push('Empty username');
        }

        if (username.length > config.constants.maxDelegateUsernameLength) {
            errors.push('Username is too long. Maximum is 20 characters');
        }

        if (isAddress.test(username)) {
            errors.push('Username can not be a potential address');
        }

        if (!allowSymbols.test(username)) {
            errors.push('Username can only contain alphanumeric characters with the exception of !@$&_.');
        }

        return new ResponseEntity<void>({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): ResponseEntity<void> {
        const errors = [];

        if (sender.delegate) {
            errors.push('Account is already a delegate');
        }

        const username = String(trs.asset.username)
        .toLowerCase()
        .trim();

        const existingDelegate: boolean = DelegateRepo.isUserNameExists(username);

        if (existingDelegate) {
            errors.push('Username already exists');
        }

        return new ResponseEntity<void>({ errors });
    }

    calculateFee(trs: Transaction<IAssetDelegate>, sender: Account): number {
        return config.constants.fees.delegate;
    }

    applyUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): void {
        sender.delegate = DelegateRepo.add(sender, {
            username: trs.asset.username,
            url: trs.asset.url
        });
    }

    undoUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account, senderOnly): void {
        if (!senderOnly) {
            DelegateRepo.delete(sender);
        }
        sender.delegate = null;
    }
}

export default new TransactionDelegateService();
