import AccountRepo from 'core/repository/account';
import { referredUsersFactory, FactorAction } from 'core/repository/referredUsers';
import { ResponseEntity } from 'shared/model/response';
import {
    IAirdropAsset,
    IAssetStake,
    IAssetVote,
    Transaction,
    TransactionModel,
    TransactionType,
} from 'shared/model/transaction';
import { Address } from 'shared/model/types';
import { isARPEnabled } from 'core/util/feature';
import DDKRegistry from 'ddk.registry';
import { Account, AccountChangeAction } from 'shared/model/account';
import config from 'shared/config';
import { Stake } from 'ddk.registry/dist/model/common/transaction/stake';
import { createAirdropReward } from 'ddk.registry/dist/util/arp/util';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import { isEqualMaps } from 'core/util/common';
import BlockRepo from 'core/repository/block';

class StakeReward {
    private readonly milestones = config.CONSTANTS.FROZE.REWARDS.MILESTONES;
    private readonly distance = Math.floor(config.CONSTANTS.FROZE.REWARDS.DISTANCE);

    calcMilestone(height) {
        const location = Math.trunc((height) / this.distance);
        const lastMile = this.milestones[this.milestones.length - 1];

        if (location > (this.milestones.length - 1)) {
            return this.milestones.lastIndexOf(lastMile);
        }
        return location;
    }

    calcReward(height) {
        return this.milestones[this.calcMilestone(height)];
    }
}

const stakeReward = new StakeReward();

export const calculateTotalRewardAndUnstake = (
    trs: TransactionModel<IAssetVote>,
    sender: Account,
    isDownVote: boolean,
): { reward: number, unstake: number } => {
    let reward: number = 0;
    let unstakeAmount: number = 0;

    if (isDownVote) {
        return { reward, unstake: unstakeAmount };
    }

    sender.stakes
        .filter(stake => stake.isActive && trs.createdAt >= stake.nextVoteMilestone)
        .forEach((stake: Stake) => {
            if (stake.voteCount > 0 && (stake.voteCount + 1) % config.CONSTANTS.FROZE.REWARD_VOTE_COUNT === 0) {
                const blockHeight: number = BlockRepo.getLastBlock().height;
                const stakeRewardPercent: number = stakeReward.calcReward(blockHeight);
                reward += (stake.amount * stakeRewardPercent) / TOTAL_PERCENTAGE;
            }
            if (stake.voteCount + 1 === config.CONSTANTS.FROZE.UNSTAKE_VOTE_COUNT) {
                unstakeAmount += stake.amount;
            }
        });

    return { reward, unstake: unstakeAmount };
};

export const getAirdropReward = (
    sender: Account,
    amount: number,
    transactionType: TransactionType
): IAirdropAsset => {
    const result: IAirdropAsset = {
        sponsors: new Map<Address, number>(),
    };

    if (!amount) {
        return result;
    }

    const availableAirdropBalance: number = AccountRepo.getByAddress(config.CONSTANTS.AIRDROP.ADDRESS).actualBalance;

    if (!sender || !sender.referrals || (sender.referrals.length === 0)) {
        return result;
    }

    const referrals = [];
    if (transactionType === TransactionType.STAKE) {
        referrals.push(sender.referrals[0]);
    } else {
        referrals.push(...sender.referrals);
    }

    let airdropRewardAmount: number = 0;
    const sponsors: Map<Address, number> = new Map<Address, number>();

    referrals.forEach((sponsor: Account, i: number) => {
        const reward = transactionType === TransactionType.STAKE
            ? Math.ceil((amount * config.CONSTANTS.AIRDROP.STAKE_REWARD_PERCENT) / TOTAL_PERCENTAGE)
            : Math.ceil(((config.CONSTANTS.AIRDROP.REFERRAL_PERCENT_PER_LEVEL[i]) * amount) / TOTAL_PERCENTAGE);
        sponsors.set(sponsor.address, reward);
        airdropRewardAmount += reward;
    });

    if (availableAirdropBalance < airdropRewardAmount) {
        return result;
    }

    result.sponsors = sponsors;

    return result;
};

const mergedAirdrops = (...airdrops: Array<IAirdropAsset>): IAirdropAsset => {
    const mergedAirdrop = createAirdropReward();

    airdrops.forEach(airdrop => {
        airdrop.sponsors.forEach((reward, address) => {
            mergedAirdrop.sponsors.set(address, reward);
        });
    });

    return mergedAirdrop;
};

const getARPReward = (trs: Transaction<IAssetStake | IAssetVote>, sender: Account): IAirdropAsset => {
    const availableAirdropBalance = AccountRepo
        .getByAddress(BigInt(DDKRegistry.config.ARP.ADDRESS)).actualBalance;

    if (trs.type === TransactionType.STAKE) {
        return DDKRegistry.stakeARPCalculator.calculate(
            sender,
            (trs as Transaction<IAssetStake>).asset.amount,
            availableAirdropBalance,
        );
    }

    return DDKRegistry.voteARPCalculator
        .calculate(sender, availableAirdropBalance, trs.createdAt);
};

export const verifyAirdrop = (
    trs: Transaction<IAssetStake | IAssetVote>,
    amount: number,
    sender: Account
): ResponseEntity<void> => {
    const airdropReward = isARPEnabled()
        ? mergedAirdrops(
            getAirdropReward(sender, amount, trs.type),
            getARPReward(trs, sender),
        )
        : getAirdropReward(sender, amount, trs.type);

    if (!isEqualMaps(airdropReward.sponsors, trs.asset.airdropReward.sponsors)) {
        return new ResponseEntity<void>({
            errors: [
                `Verify failed: ${trs.type === TransactionType.STAKE ? 'stake' : 'vote'} ` +
                `airdrop reward is corrupted, ` +
                `expected: ${JSON.stringify([...trs.asset.airdropReward.sponsors])}, ` +
                `actual: ${JSON.stringify([...airdropReward.sponsors])}`
            ]
        });
    }

    return new ResponseEntity<void>();
};

export function applyFrozeOrdersRewardAndUnstake(trs: Transaction<IAssetVote>, activeOrders: Array<Stake>): void {
    applyRewards(trs);
    applyUnstake(activeOrders, trs);
}

function applyRewards(trs: Transaction<IAssetVote>): void {
    AccountRepo.updateBalanceByAddress(trs.senderAddress, trs.asset.reward);
    AccountRepo.updateBalanceByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS, -trs.asset.reward);
}

function applyUnstake(orders: Array<Stake>, trs: Transaction<IAssetVote>): void {
    const readyToUnstakeOrders = orders.filter(o => o.voteCount === config.CONSTANTS.FROZE.UNSTAKE_VOTE_COUNT);
    readyToUnstakeOrders.map((order) => {
        order.isActive = false;
    });
    AccountRepo.updateBalanceByAddress(trs.senderAddress, trs.asset.unstake);

    referredUsersFactory.get().updateStakeAmountFactor(trs.senderAddress, trs.asset.unstake, FactorAction.SUBTRACT);
}

export function isSponsorsExist(trs: Transaction<IAssetStake | IAssetVote>): boolean {
    return trs.asset.airdropReward.sponsors.size !== 0;
}

export function sendAirdropReward(trs: Transaction<IAssetStake | IAssetVote>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const [sponsorAddress, rewardAmount] of transactionAirdropReward.sponsors) {
        if (rewardAmount === 0) {
            continue;
        }

        const recipient = AccountRepo.getByAddress(sponsorAddress);
        recipient.actualBalance += rewardAmount;
        recipient.addHistory(AccountChangeAction.AIRDROP_REWARD_RECEIVE, trs.id);

        AccountRepo.updateBalanceByAddress(config.CONSTANTS.AIRDROP.ADDRESS, -rewardAmount);
    }

    referredUsersFactory.get().updateRewardFactor(trs, FactorAction.ADD);
}

export function undoAirdropReward(trs: Transaction<IAssetVote | IAssetStake>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const [sponsorAddress, rewardAmount] of transactionAirdropReward.sponsors) {
        if (rewardAmount === 0) {
            continue;
        }
        const recipient = AccountRepo.getByAddress(sponsorAddress);
        recipient.actualBalance -= rewardAmount;
        recipient.addHistory(AccountChangeAction.AIRDROP_REWARD_RECEIVE_UNDO, trs.id);

        AccountRepo.updateBalanceByAddress(config.CONSTANTS.AIRDROP.ADDRESS, rewardAmount);
    }

    referredUsersFactory.get().updateRewardFactor(trs, FactorAction.SUBTRACT);
}

export function undoFrozeOrdersRewardAndUnstake(
    trs: Transaction<IAssetVote>,
    sender: Account,
    senderOnly: boolean
): void {
    const updatedOrders = sender.stakes.filter((order: Stake) => {
        return order.nextVoteMilestone === trs.createdAt + config.CONSTANTS.FROZE.VOTE_MILESTONE;
    });
    undoUnstake(updatedOrders, trs, sender);
    undoRewards(trs, sender, senderOnly);
}

function undoUnstake(orders: Array<Stake>, trs: Transaction<IAssetVote>, sender: Account): void {
    const unstakedOrders = orders.filter(order => !order.isActive);
    unstakedOrders.map((order) => {
        order.isActive = true;
    });
    sender.actualBalance -= trs.asset.unstake;

    referredUsersFactory.get().updateStakeAmountFactor(sender.address, trs.asset.unstake, FactorAction.ADD);
}

function undoRewards(trs: Transaction<IAssetVote>, sender: Account, senderOnly: boolean): void {
    sender.actualBalance -= trs.asset.reward;
    if (!senderOnly) {
        AccountRepo.updateBalanceByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS, trs.asset.reward);
    }
}
