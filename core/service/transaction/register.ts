import { IAssetService } from 'core/service/transaction';
import {IAssetRegister, Transaction, TransactionModel} from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import Response from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';

class TransactionRegisterService implements IAssetService<IAssetRegister> {

    create(trs: TransactionModel<IAssetRegister>): IAssetRegister {
        return {
            referral: trs.asset.referral,
        };
    }

    getBytes(trs: Transaction<IAssetRegister>): Buffer {
        const buff = Buffer.alloc(BUFFER.LENGTH.INT64);
        BUFFER.writeUInt64LE(buff, trs.asset.referral, 0);
        return buff;
    }

    validate(trs: Transaction<IAssetRegister>): Response<void> {
        const errors = [];

        if (!trs.asset.referral) {
            errors.push('Missing referral');
        }

        return new Response({ errors });
    }

    // TODO check empty account
    verifyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): Response<void> {
        if (
            sender.secondPublicKey ||
            sender.actualBalance !== 0 ||
            sender.delegate ||
            (sender.votes && sender.votes.length) ||
            (sender.referrals && sender.referrals.length) ||
            (sender.stakes && sender.stakes.length)
        ) {
            return new Response({ errors: ['Account already exists.'] });
        }
        return new Response();
    }

    calculateFee(trs: Transaction<IAssetRegister>, sender: Account): number {
        return 0;
    }

    applyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): void {
        const referralAccount: Account = AccountRepo.getByAddress(trs.asset.referral);
        const referrals: Array<Account> =
            referralAccount.referrals.slice(0, config.constants.airdrop.maxReferralCount - 1);

        const targetAccount: Account = AccountRepo.add({ address: trs.senderAddress, publicKey: trs.senderPublicKey });
        AccountRepo.updateReferralByAddress(targetAccount.address, [referralAccount, ...referrals]);
    }

    undoUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account, senderOnly): void {
        // TODO strange logic for not referral account
        AccountRepo.delete(sender);
    }

}

export default new TransactionRegisterService();
