import {IAssetService} from '../transaction';
import {
    IAssetStake,
    Transaction,
    TransactionType,
    IAirdropAsset, TransactionModel,
} from 'shared/model/transaction';
import ResponseEntity from 'shared/model/response';
import {Account} from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';

import { getAirdropReward, verifyAirdrop } from 'core/util/reward';

class TransactionStakeService implements IAssetService<IAssetStake>  {

    create(trs: TransactionModel<IAssetStake>): void {
        const sender: Account = AccountRepo.getByAddress(trs.senderAddress);
        const airdropReward: IAirdropAsset = getAirdropReward(
                sender,
                trs.asset.amount,
                TransactionType.STAKE
            );
        trs.asset = {
            amount: trs.asset.amount,
            startTime: trs.createdAt,
            startVoteCount: 0,
            airdropReward: airdropReward
        };
    }

    getBytes(trs: Transaction<IAssetStake>): Buffer {
        let offset = 0;
        const buff = Buffer.alloc(
            BUFFER.LENGTH.INT64 +  // asset.amount
            BUFFER.LENGTH.UINT32 + // asset.startTime
            BUFFER.LENGTH.BYTE     // asset.startVoteCount
        );
        offset = BUFFER.writeUInt64LE(buff, trs.asset.amount || 0, offset);

        offset += BUFFER.LENGTH.UINT32;
        buff.writeInt32LE(trs.asset.startTime, offset);
        offset += BUFFER.LENGTH.UINT32;
        buff.writeInt8(trs.asset.startVoteCount, offset);

        const referralBuffer = Buffer.alloc(
            BUFFER.LENGTH.INT64 + // asset.airdropReward.address
            BUFFER.LENGTH.INT64   // asset.airdropReward.amount
        );
        offset = 0;
        if (trs.asset.airdropReward.sponsors && trs.asset.airdropReward.sponsors.size > 0) {
            for (const [sponsorAddress, reward] of trs.asset.airdropReward.sponsors) {
                offset = BUFFER.writeUInt64LE(referralBuffer, sponsorAddress, offset);
                BUFFER.writeUInt64LE(referralBuffer, reward || 0, offset);
            }
        }

        return Buffer.concat([buff, referralBuffer]);
    }

    validate(trs: Transaction<IAssetStake>, sender: Account): ResponseEntity<any> {
        const errors = [];
        if (trs.asset.amount <= 0) {
            errors.push('Invalid transaction amount');
        }

        if ((trs.asset.amount % 1) !== 0) {
            errors.push('Invalid stake amount: Decimal value');
        }

        return new ResponseEntity({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): ResponseEntity<void> {
        // TODO checkBalance
        let errors = [];
        const airdropCheck: ResponseEntity<any> = verifyAirdrop(trs, trs.asset.amount, sender);
        if (!airdropCheck.success) {
            errors = airdropCheck.errors;
        }
        return new ResponseEntity({ errors });
    }

    calculateFee(trs: Transaction<IAssetStake>, sender?: Account): number {
        return (trs.asset.amount * config.constants.fees.froze) / TOTAL_PERCENTAGE;
    }

    applyUnconfirmed(trs: Transaction<IAssetStake>): void {
        const totalAmount: number = trs.fee + trs.asset.amount;
        AccountRepo.updateBalanceByAddress(trs.senderAddress, -totalAmount);
    }

    undoUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): void {
        const fee: number = this.calculateFee(trs);
        const totalAmount: number = fee + trs.asset.amount;
        AccountRepo.updateBalanceByAddress(trs.senderAddress, totalAmount);
    }

}

export default new TransactionStakeService();
