import { Address, Account, Stake } from 'shared/model/account';
import { logger } from 'shared/util/logger';
import config from 'shared/config';
import BlockRepo from 'core/repository/block';
import { IAirdropAsset, IAssetStake, IAssetVote, Transaction, TransactionType } from 'shared/model/transaction';
import AccountRepo from 'core/repository/account';
import { ResponseEntity } from 'shared/model/response';
import { TOTAL_PERCENTAGE, MONEY_FACTOR } from 'core/util/const';
import { isEqualMaps } from 'core/util/common';
import SlotService from 'core/service/slot';

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
    sender: Account,
    isDownVote: boolean,
): { reward: number, unstake: number } => {
    let reward: number = 0;
    let unstakeAmount: number = 0;
    if (isDownVote) {
        return { reward, unstake: unstakeAmount };
    }
    const freezeOrders: Array<Stake> = sender.stakes;
    logger.debug(`[Frozen][calculateTotalRewardAndUnstake] freezeOrders: ${JSON.stringify(freezeOrders)}`);

    freezeOrders
        .filter(stake => SlotService.getTime() > stake.nextVoteMilestone)
        .forEach((stake: Stake) => {
            if (stake.voteCount > 0 && (stake.voteCount + 1) % config.CONSTANTS.FROZE.REWARD_VOTE_COUNT === 0) {
                const blockHeight: number = BlockRepo.getLastBlock().height;
                const stakeRewardPercent: number = stakeReward.calcReward(blockHeight);
                reward += (stake.amount * stakeRewardPercent) / TOTAL_PERCENTAGE;
            }
        });
    const readyToUnstakeOrders = freezeOrders.filter(
        o => (o.voteCount + 1) === config.CONSTANTS.FROZE.UNSTAKE_VOTE_COUNT
    );
    logger.debug(`[Frozen][calculateTotalRewardAndUnstake] reward: ${reward}`);
    readyToUnstakeOrders.forEach((order) => {
        unstakeAmount += order.amount;
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

    logger.info(`availableAirdropBalance: ${availableAirdropBalance / MONEY_FACTOR}`);

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

export const verifyAirdrop = (
    trs: Transaction<IAssetStake | IAssetVote>,
    amount: number,
    sender: Account
): ResponseEntity<void> => {
    const airdropReward = getAirdropReward(sender, amount, trs.type);

    if (!isEqualMaps(airdropReward.sponsors, trs.asset.airdropReward.sponsors)) {
        return new ResponseEntity<void>({
            errors: [
                `Verify failed: ${trs.type === TransactionType.STAKE ? 'stake' : 'vote'}` +
                `airdrop reward is corrupted, ` +
                `expected: ${JSON.stringify([...airdropReward.sponsors])}, ` +
                `actual: ${JSON.stringify([...trs.asset.airdropReward.sponsors])}`
            ]
        });
    }

    return new ResponseEntity<void>();
};

export function applyFrozeOrdersRewardAndUnstake(
    trs: Transaction<IAssetVote>,
    activeOrders: Array<Stake>): void {
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
}

export function sendAirdropReward(trs: Transaction<IAssetStake | IAssetVote>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const [sponsorAddress, rewardAmount] of transactionAirdropReward.sponsors) {
        if (rewardAmount === 0) {
            continue;
        }
        AccountRepo.updateBalanceByAddress(sponsorAddress, rewardAmount);
        AccountRepo.updateBalanceByAddress(config.CONSTANTS.AIRDROP.ADDRESS, -rewardAmount);
    }
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
}

function undoRewards(trs: Transaction<IAssetVote>, sender: Account, senderOnly: boolean): void {
    sender.actualBalance -= trs.asset.reward;
    if (!senderOnly) {
        AccountRepo.updateBalanceByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS, trs.asset.reward);
    }
}

export function undoAirdropReward(trs: Transaction<IAssetVote | IAssetStake>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const [sponsorAddress, rewardAmount] of transactionAirdropReward.sponsors) {
        if (rewardAmount === 0) {
            continue;
        }
        AccountRepo.updateBalanceByAddress(sponsorAddress, -rewardAmount);
        AccountRepo.updateBalanceByAddress(config.CONSTANTS.AIRDROP.ADDRESS, rewardAmount);
    }
}
