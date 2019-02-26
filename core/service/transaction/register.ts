import { ITransactionService } from 'core/service/transaction';
import { IAssetRegister, Transaction } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';
import {ITableObject} from 'core/util/common';

class TransactionRegisterService implements ITransactionService<IAssetRegister> {

    async create(trs: Transaction<IAssetRegister>, data: IAssetRegister ): Promise<IAssetRegister> {
        trs.recipientAddress = null;
        return {
            referral: data.referral
        };
    }

    getBytes(trs: Transaction<IAssetRegister>): Buffer {
        const buff = Buffer.alloc(BUFFER.LENGTH.INT64);
        BUFFER.writeUInt64LE(buff, trs.asset.referral, 0);
        return buff;
    }

    async verifyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Promise<Response<void>> {
        return new Response();
    }

    async verify(trs: Transaction<IAssetRegister>, sender: Account): Promise<Response<void>> {
        const errors = [];

        if (!trs.asset.referral) {
            errors.push('Missing referral');
        }

        if (sender) {
            errors.push('Account already exists.');
        }

        return new Response({ errors });
    }

    calculateFee(trs: Transaction<IAssetRegister>, sender: Account): number {
        return 0;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): void {
    }

    async applyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Promise<Response<void>> {
        const sponsor: Account = AccountRepo.getByAddress(trs.asset.referral);
        const sponsorsReferrals: Array<Account> =
            sponsor.referrals.slice(0, config.constants.airdrop.maxReferralCount - 1);
        const addAccountResponse: Response<Account> =
            AccountRepo.add({address: trs.senderAddress, publicKey: trs.senderPublicKey});
        if (!addAccountResponse.success) {
            return new Response<void>({ errors: [...addAccountResponse.errors, 'Can\'t add account'] });
        }
        const targetAccount = addAccountResponse.data;
        const updateResponse: Response<void> =
            AccountRepo.updateReferralByAddress(targetAccount.address, [sponsor, ...sponsorsReferrals]);
        if (!updateResponse.success) {
            return new Response<void>({ errors: [...addAccountResponse.errors, 'Can\'t update account referrals'] });
        }
        return new Response<void>();
    }

    async undoUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Promise<Response<void>> {
        const targetAccount: Account = AccountRepo.getByAddress(trs.asset.referral);
        AccountRepo.delete(targetAccount);
        return new Response<void>();
    }

    async apply(trs: Transaction<IAssetRegister>): Promise<Response<void>> {
        return new Response<void>();
    }

    async undo(trs: Transaction<IAssetRegister>): Promise<Response<void>> {
        return new Response<void>();
    }

    dbRead(fullBlockRow: Transaction<IAssetRegister>): Transaction<IAssetRegister> {
        return null;
    }

    dbSave(trs: Transaction<IAssetRegister>): Array<ITableObject> {
        return null;
    }
}

export default new TransactionRegisterService();
