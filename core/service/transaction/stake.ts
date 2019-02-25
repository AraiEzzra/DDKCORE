import { ITransactionService } from '../transaction';
import {IAsset, IAirdropAsset} from 'shared/model/transaction';
import { IAssetStake, Transaction } from 'shared/model/transaction';
import ResponseEntity from 'shared/model/response';
import {Account} from 'shared/model/account';
import AccountRepo from 'core/repository/account';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';
import {
    calculateTotalRewardAndUnstake,
    getAirdropReward,
    verifyAirdrop,
    applyFrozeOrdersRewardAndUnstake,
    undoFrozeOrdersRewardAndUnstake
} from 'core/util/reward';

class TransactionStakeService implements ITransactionService<IAssetStake> {

    async create(trs: Transaction<IAssetStake>, data?: IAssetStake ): Promise<IAssetStake> {
        const sender: Account = AccountRepo.getByAddress(trs.senderAddress);
        const totals: { reward: number, unstake: number} = await calculateTotalRewardAndUnstake(sender, isDownVote);
        const airdropReward: IAirdropAsset = await getAirdropReward(sender, totals.reward, trs.type);

        const asset: IAssetStake = {
            stakeOrder: {
                stakedAmount: trs.amount,
                startTime: trs.createdAt,
                nextVoteMilestone: trs.createdAt,
            },
            airdropReward: airdropReward
        };

        return asset;
    }

    getBytes(asset: IAssetStake): Uint8Array {
        return Buffer.from([]);
    }

    verifyUnconfirmed(trs: Transaction<IAsset>): ResponseEntity<void> {
        return new ResponseEntity();
    }

    verify(trs: Transaction<IAssetStake>, sender: Account): ResponseEntity<any> {
        const errors = [];

        if (trs.amount <= 0) {
            errors.push('Invalid transaction amount');
        }

        return new ResponseEntity({ errors });
    }

    calculateFee(trs: Transaction<IAsset>, sender?: Account): number {
        return (trs.amount * config.constants.fees.froze) / TOTAL_PERCENTAGE;
    }

    calcUndoUnconfirmed(trs: Transaction<IAsset>, sender: Account): void {
        return;
    }

    applyUnconfirmed(trs: Transaction<IAsset>): ResponseEntity<void> {
        const fee: number = this.calculateFee(trs);
        const totalAmount: number = fee + trs.amount;
        return AccountRepo.updateBalanceByAddress(trs.senderAddress, totalAmount * (-1));
    }

    undoUnconfirmed(trs: Transaction<IAssetStake>, sender: Account): ResponseEntity<void> {
        return null;
    }

    apply(asset: IAssetStake): Promise<void> {
        return null;
    }

    undo(asset: IAssetStake): Promise<void> {
        return null;
    }

    dbRead(fullTrsObject: any): IAssetStake {
        return null;
    }

    dbSave(asset: IAssetStake): Promise<void> {
        return null;
    }
}

export default new TransactionStakeService();
