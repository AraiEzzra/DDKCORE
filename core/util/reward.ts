import {Address, Account, Stake} from 'shared/model/account';
import { logger } from 'shared/util/logger';
import config from 'shared/util/config';
import BlockRepo from 'core/repository/block';
import {IAirdropAsset, IAssetStake, IAssetVote, Transaction, TransactionType} from 'shared/model/transaction';
import AccountRepo from 'core/repository/account';
import { ResponseEntity } from 'shared/model/response';
import { TOTAL_PERCENTAGE, SECONDS_PER_MINUTE, MONEY_FACTOR } from 'core/util/const';

class StakeReward {
    private readonly milestones = config.constants.froze.rewards.milestones;
    private readonly distance = Math.floor(config.constants.froze.rewards.distance);

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

export function calculateTotalRewardAndUnstake(sender: Account, isDownVote: boolean)
        : { reward: number, unstake: number} {
    let reward: number = 0;
    let unstakeAmount: number = 0;
    if (isDownVote) {
        return { reward, unstake: unstakeAmount };
    }
    const freezeOrders: Array<Stake> = sender.stakes;
    logger.debug(`[Frozen][calculateTotalRewardAndUnstake] freezeOrders: ${JSON.stringify(freezeOrders)}`);

    freezeOrders.forEach((order: Stake) => {
        if (order.voteCount > 0 && (order.voteCount + 1) % config.constants.froze.rewardVoteCount === 0) {
            const blockHeight: number = BlockRepo.getLastBlock().height;
            const stakeRewardPercent: number = stakeReward.calcReward(blockHeight);
            reward += (order.amount * stakeRewardPercent) / TOTAL_PERCENTAGE;
        }
    });
    const readyToUnstakeOrders = freezeOrders.filter(
        o => (o.voteCount + 1) === config.constants.froze.unstakeVoteCount
    );
    logger.debug(`[Frozen][calculateTotalRewardAndUnstake] reward: ${reward}`);
    readyToUnstakeOrders.forEach((order) => {
        unstakeAmount -= order.amount;
    });
    return { reward, unstake: unstakeAmount };
}

// todo: check if available, redis
export function getAirdropReward(
    sender: Account,
    amount: number,
    transactionType: TransactionType): IAirdropAsset {

    const result: IAirdropAsset = {
        sponsors: new Map<Address, number>()
    };

    const availableAirdropBalance: number = AccountRepo.getByAddress(config.constants.airdrop.account).actualBalance;
    logger.info(`availableAirdropBalance: ${availableAirdropBalance / MONEY_FACTOR}`);

    if (!sender || !sender.referrals || (sender.referrals.length === 0)) {
        return result;
    }

    if (transactionType === TransactionType.STAKE) {
        sender.referrals = [sender.referrals[0]];
    }

    let airdropRewardAmount: number = 0;
    const sponsors: Map<Address, number> = new Map<Address, number>();

    sender.referrals.forEach((sponsor: Account, i: number) => {
        const reward = transactionType === TransactionType.STAKE ?
            Math.ceil((amount * config.constants.airdrop.stakeRewardPercent) / TOTAL_PERCENTAGE) :
            Math.ceil(((config.constants.airdrop.referralPercentPerLevel[i]) * amount) / TOTAL_PERCENTAGE);
        sponsors.set(sponsor.address, reward);
        airdropRewardAmount += reward;
    });

    if (availableAirdropBalance < airdropRewardAmount) {
        return result;
    }

    result.sponsors = sponsors;

    return result;
}

export function verifyAirdrop(
    trs: Transaction<IAssetStake | IAssetVote>,
    amount: number,
    sender: Account): ResponseEntity<void> {
    const airdropReward = getAirdropReward(
        sender,
        amount,
        trs.type
    );

    if (
        JSON.stringify(airdropReward.sponsors) !== JSON.stringify(trs.asset.airdropReward.sponsors)
    ) {
        return new ResponseEntity<void>({ errors: [
            `Verify failed: ${trs.type === TransactionType.STAKE ? 'stake' : 'vote'} airdrop reward is corrupted,
            expected:
            sponsors: ${JSON.stringify(airdropReward.sponsors)}
            actual:
            sponsors: ${JSON.stringify(trs.asset.airdropReward.sponsors)}`
            ] });
    }
    return new ResponseEntity<void>();
}

export function applyFrozeOrdersRewardAndUnstake(
    trs: Transaction<IAssetVote>,
    activeOrders: Array<Stake>): void {
    applyRewards(trs);
    applyUnstake(activeOrders, trs);
}

function applyRewards(trs: Transaction<IAssetVote>): void {
    AccountRepo.updateBalanceByAddress(trs.senderAddress, trs.asset.reward);
    AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, -trs.asset.reward);
}

function applyUnstake(orders: Array<Stake>, trs: Transaction<IAssetVote>): void {
    const readyToUnstakeOrders = orders.filter(o => o.voteCount === config.constants.froze.unstakeVoteCount);
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
        AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, -rewardAmount);
    }
}

export function undoFrozeOrdersRewardAndUnstake(trs: Transaction<IAssetVote>): void {
    const senderStakes: Array<Stake> = AccountRepo.getByAddress(trs.senderAddress).stakes;
    const updatedOrders = senderStakes.map((order: Stake) => {
        if (order.nextVoteMilestone === trs.createdAt + config.constants.froze.vTime * SECONDS_PER_MINUTE) {
            return order;
        }
    });
    undoUnstake(updatedOrders, trs);
    undoRewards(trs);
}

function undoUnstake(orders: Array<Stake>, trs: Transaction<IAssetVote>): void {
    const unstakedOrders = orders.filter(order => !order.isActive);
    unstakedOrders.map((order) => {
        order.isActive = true;
    });
    AccountRepo.updateBalanceByAddress(trs.senderAddress, -trs.asset.unstake);
}

function undoRewards(trs: Transaction<IAssetVote>): void {
    AccountRepo.updateBalanceByAddress(trs.senderAddress, -trs.asset.reward);
    AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, trs.asset.reward);
}

export function undoAirdropReward(trs: Transaction<IAssetVote | IAssetStake>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const [sponsorAddress, rewardAmount] of transactionAirdropReward.sponsors) {
        if (rewardAmount === 0) {
            continue;
        }
        AccountRepo.updateBalanceByAddress(sponsorAddress, -rewardAmount);
        AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, rewardAmount);
    }
}
