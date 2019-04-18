import { IAssetService } from 'core/service/transaction';
import { IAssetRegister, Transaction, TransactionModel } from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { ResponseEntity } from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/config';
import BUFFER from 'core/util/buffer';

class TransactionRegisterService implements IAssetService<IAssetRegister> {

    create(trs: TransactionModel<IAssetRegister>): IAssetRegister {
        return {
            referral: BigInt(trs.asset.referral),
        };
    }

    getBytes(trs: Transaction<IAssetRegister>): Buffer {
        const buff = Buffer.alloc(BUFFER.LENGTH.INT64);
        BUFFER.writeUInt64LE(buff, trs.asset.referral, 0);
        return buff;
    }

    validate(trs: Transaction<IAssetRegister>): ResponseEntity<void> {
        const errors = [];

        if (!trs.asset.referral) {
            errors.push('Missing referral');
        }

        return new ResponseEntity<void>({ errors });
    }

    // TODO check empty account
    verifyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): ResponseEntity<void> {
        const errors = [];

        if (
            sender.secondPublicKey ||
            sender.actualBalance !== 0 ||
            sender.delegate ||
            (sender.votes && sender.votes.length) ||
            (sender.referrals && sender.referrals.length) ||
            (sender.stakes && sender.stakes.length)
        ) {
            return new ResponseEntity<void>({ errors: ['Account already exists.'] });
        }
        return new ResponseEntity<void>({ errors });
    }

    calculateFee(trs: Transaction<IAssetRegister>, sender: Account): number {
        return 0;
    }

    applyUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account): void {
        let referralAccount: Account = AccountRepo.getByAddress(trs.asset.referral);

        if (!referralAccount) {
            referralAccount = AccountRepo.add({
                address: trs.asset.referral,
            });
        }

        const referrals: Array<Account> =
            referralAccount.referrals.slice(0, config.CONSTANTS.REFERRAL.MAX_COUNT - 1);

        const targetAccount: Account = AccountRepo.add({
            address: trs.senderAddress,
            publicKey: trs.senderPublicKey
        });
        targetAccount.referrals = [referralAccount, ...referrals];
    }

    undoUnconfirmed(trs: Transaction<IAssetRegister>, sender: Account, senderOnly: boolean): void {
        sender.referrals = [];
    }

}

export default new TransactionRegisterService();
