import { IAssetService } from 'core/service/transaction';
import { IAssetDelegate, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { Delegate } from 'shared/model/delegate';
import DelegateRepo from 'core/repository/delegate';
import Response from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';

class TransactionDelegateService implements IAssetService<IAssetDelegate> {

    create(trs: Transaction<IAssetDelegate>, data: IAssetDelegate): IAssetDelegate {
        const asset: IAssetDelegate = {
            username: data.username,
            url: data.url
        };

        if (asset.username) {
            asset.username = asset.username.toLowerCase().trim();
        }
        return asset;
    }

    getBytes(trs: Transaction<IAssetDelegate>): Buffer {
        return Buffer.from(trs.asset.username, 'utf8');
    }

    verifyUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): Response<void> {
        return new Response();
    }

    validate(trs: Transaction<IAssetDelegate>, sender: Account): Response<void> {
        const errors = [];

        if (trs.recipientAddress) {
            errors.push('Invalid recipient');
        }

        if (trs.amount !== 0) {
            errors.push('Invalid transaction amount');
        }

        if (sender.delegate) {
            errors.push('Account is already a delegate');
        }

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

        const existingDelegate: boolean = DelegateRepo.isUserNameExists(username);
        if (existingDelegate) {
            errors.push('Username already exists');
        }

        return new Response({ errors });
    }

    calculateFee(trs: Transaction<IAssetDelegate>, sender: Account): number {
        return config.constants.fees.delegate;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): void {
        sender.delegate = null;
    }

    applyUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): Response<void> {
        const newDelegate: Delegate = DelegateRepo.add(sender, {
            username: trs.asset.username,
            url: trs.asset.url
        });
        AccountRepo.attachDelegate(sender, newDelegate);
        return new Response<void>();
    }

    undoUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): Response<void> {
        DelegateRepo.delete(sender);
        AccountRepo.attachDelegate(sender, null);
        return new Response<void>();
    }

    async apply(trs: Transaction<IAssetDelegate>): Promise<Response<void>> {
        return new Response<void>();
    }

    async undo(trs: Transaction<IAssetDelegate>): Promise<Response<void>> {
        return new Response<void>();
    }
}

export default new TransactionDelegateService();
