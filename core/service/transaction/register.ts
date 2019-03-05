import { IAssetService } from 'core/service/transaction';
import {IAssetRegister, Transaction, TransactionModel} from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';

class TransactionRegisterService implements IAssetService<IAssetRegister> {

    create(trs: TransactionModel<IAssetRegister>): void {

    }

    getBytes(trs: Transaction<IAssetRegister>): Buffer {
        const buff = Buffer.alloc(BUFFER.LENGTH.INT64);
        BUFFER.writeUInt64LE(buff, trs.asset.referral, 0);
        return buff;
    }

    verifyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Response<void> {
        return new Response();
    }

    validate(trs: Transaction<IAssetRegister>, sender: Account): Response<void> {
        const errors = [];

        if (!trs.asset.referral) {
            errors.push('Missing referral');
        }

        return new Response({ errors });
    }

    calculateFee(trs: Transaction<IAssetRegister>, sender: Account): number {
        return 0;
    }

    calculateUndoUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): void {
    }

    applyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Response<void> {
        const referralAccount: Account = AccountRepo.getByAddress(trs.asset.referral);
        const referrals: Array<Account> =
            referralAccount.referrals.slice(0, config.constants.airdrop.maxReferralCount - 1);
        const addAccountResponse: Response<Account> =
            AccountRepo.add({address: trs.senderAddress, publicKey: trs.senderPublicKey});
        if (!addAccountResponse.success) {
            return new Response<void>({ errors: [...addAccountResponse.errors, 'Can\'t add account'] });
        }
        const targetAccount = addAccountResponse.data;
        const updateResponse: Response<void> =
            AccountRepo.updateReferralByAddress(targetAccount.address, [referralAccount, ...referrals]);
        if (!updateResponse.success) {
            return new Response<void>({ errors: [...addAccountResponse.errors, 'Can\'t update account referrals'] });
        }
        return new Response<void>();
    }

    undoUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Response<void> {
        AccountRepo.delete(sender);
        return new Response<void>();
    }

}

export default new TransactionRegisterService();
