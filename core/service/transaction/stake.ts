import {IAssetService} from 'core/service/transaction';
import {
    IAssetStake,
    Transaction,
    TransactionType,
    IAirdropAsset, TransactionModel,
} from 'shared/model/transaction';
import { ResponseEntity } from 'shared/model/response';
import {Account, Stake} from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import { TOTAL_PERCENTAGE, SECONDS_PER_MINUTE } from 'core/util/const';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';

import {getAirdropReward, sendAirdropReward, undoAirdropReward, verifyAirdrop} from 'core/util/reward';

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

    validate(trs: Transaction<IAssetStake>): ResponseEntity<void> {
        const errors = [];
        if (trs.asset.amount <= 0) {
            errors.push('Invalid transaction amount');
        }

        if ((trs.asset.amount % 1) !== 0) {
            errors.push('Invalid stake amount: Decimal value');
        }

        return new ResponseEntity<void>({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): ResponseEntity<void> {
        let errors = [];
        const airdropCheck: ResponseEntity<void> = verifyAirdrop(trs, trs.asset.amount, sender);
        if (!airdropCheck.success) {
            errors = airdropCheck.errors;
        }
        return new ResponseEntity<void>({ errors });
    }

    calculateFee(trs: Transaction<IAssetStake>, sender: Account): number {
        return (trs.asset.amount * config.constants.fees.froze) / TOTAL_PERCENTAGE;
    }

    applyUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): void {
        sender.actualBalance -= trs.asset.amount;
        sender.stakes.push(new Stake({
            createdAt: trs.createdAt,
            isActive: true,
            amount: trs.asset.amount,
            voteCount: 0,
            nextVoteMilestone: trs.createdAt + config.constants.froze.vTime * SECONDS_PER_MINUTE,
            airdropReward: trs.asset.airdropReward.sponsors,
            sourceTransactionId: trs.id
        }));
        sendAirdropReward(trs);
    }

    undoUnconfirmed(trs: Transaction<IAssetStake>, sender: Account, senderOnly): void {
        sender.actualBalance += trs.asset.amount;
        for (let i = sender.stakes.length; i > -1; i--) {
            if ( sender.stakes[i].sourceTransactionId === trs.id) {
                sender.stakes.splice(i, 1);
            }
        }
        undoAirdropReward(trs);
    }

}

export default new TransactionStakeService();
