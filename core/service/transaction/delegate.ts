import { ITransactionService } from 'core/service/transaction';
import { IAssetDelegate, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { Delegate } from 'shared/model/delegate';
import DelegateRepo from 'core/repository/delegate';
import Response from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';
import { ITableObject } from 'core/util/common';

class TransactionDelegateService implements ITransactionService<IAssetDelegate> {

    async create(trs: Transaction<IAssetDelegate>, data: IAssetDelegate): Promise<IAssetDelegate> {
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

    async verifyUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): Promise<Response<void>> {
        return new Response();
    }

    async verify(trs: Transaction<IAssetDelegate>, sender: Account): Promise<Response<void>> {
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

        const existingDelegate: Delegate = DelegateRepo.getByUsername(username);
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

    async applyUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): Promise<Response<void>> {
        const newDelegate: Delegate = DelegateRepo.add(sender, {
            username: trs.asset.username,
            url: trs.asset.url
        });
        AccountRepo.attachDelegate(sender, newDelegate);
        return new Response<void>();
    }

    async undoUnconfirmed(trs: Transaction<IAssetDelegate>, sender: Account): Promise<Response<void>> {
        DelegateRepo.deleteByUsername(sender.delegate.username);
        AccountRepo.attachDelegate(sender, null);
        return new Response<void>();
    }

    async apply(trs: Transaction<IAssetDelegate>): Promise<Response<void>> {
        return new Response<void>();
    }

    async undo(trs: Transaction<IAssetDelegate>): Promise<Response<void>> {
        return new Response<void>();
    }

    dbRead(fullBlockRow: Transaction<IAssetDelegate>): Transaction<IAssetDelegate> {
        return null;
    }

    dbSave(trs: Transaction<IAssetDelegate>): Array<ITableObject> {
        return null;
    }
}

export default new TransactionDelegateService();
