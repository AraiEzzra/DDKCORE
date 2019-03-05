import {Account, Stake} from 'shared/model/account';
import { logger } from 'shared/util/logger';
import config from 'shared/util/config';
import BlockRepo from 'core/repository/block';
import {IAirdropAsset, IAssetStake, IAssetVote, Transaction, TransactionType} from 'shared/model/transaction';
import AccountRepo from 'core/repository/account';
import Response from 'shared/model/response';

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

    calcReward = function (height) {
        return this.milestones[this.calcMilestone(height)];
    };
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
            reward += (order.amount * stakeRewardPercent) / 100;
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
        sponsors: {}
    };

    const availableAirdropBalance: number = AccountRepo.getByAddress(config.constants.airdrop.account).actualBalance;
    logger.info(`availableAirdropBalance: ${availableAirdropBalance / 100000000}`);

    if (!sender || !sender.referrals || (sender.referrals.length === 0)) {
        return result;
    }

    if (transactionType === TransactionType.STAKE) {
        sender.referrals = [sender.referrals[0]];
    }

    let airdropRewardAmount: number = 0;
    const sponsors: { [sponsorAddress: number]: number } = {};

    sender.referrals.forEach((sponsor: Account, i: number) => {
        const reward = transactionType === TransactionType.STAKE ?
            Math.ceil((amount * config.constants.airdrop.stakeRewardPercent) / 100) :
            Math.ceil(((config.constants.airdrop.referralPercentPerLevel[i]) * amount) / 100);
        sponsors[sponsor.address] = reward;
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
    sender: Account): Response<void> {
    const airdropReward = getAirdropReward(
        sender,
        amount,
        trs.type
    );

    if (
        JSON.stringify(airdropReward.sponsors) !== JSON.stringify(trs.asset.airdropReward.sponsors)
    ) {
        return new Response<void>({ errors: [
            `Verify failed: ${trs.type === TransactionType.STAKE ? 'stake' : 'vote'} airdrop reward is corrupted, 
            expected: 
            sponsors: ${JSON.stringify(airdropReward.sponsors)}  
            actual: 
            sponsors: ${JSON.stringify(trs.asset.airdropReward.sponsors)}`
            ] });
    }
    return new Response<void>();
}

export function applyFrozeOrdersRewardAndUnstake(
    voteTransaction: Transaction<IAssetVote>,
    activeOrders: Array<Stake>): Response<void> {
    applyRewards(voteTransaction);
    sendAirdropReward(voteTransaction);
    applyUnstake(activeOrders, voteTransaction);
    return new Response<void>();
}

function applyRewards(voteTransaction: Transaction<IAssetVote>): void {
    const reward = voteTransaction.asset.reward;
    AccountRepo.updateBalanceByAddress(voteTransaction.senderAddress, reward);
    AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, -reward);
}

function applyUnstake(orders: Array<Stake>, voteTransaction: Transaction<IAssetVote>): void {
    const readyToUnstakeOrders = orders.filter(o => o.voteCount === config.constants.froze.unstakeVoteCount);
    readyToUnstakeOrders.map((order) => {
        order.isActive = false;
    });
    AccountRepo.updateBalanceByAddress(voteTransaction.senderAddress, voteTransaction.asset.unstake);
}

function sendAirdropReward(trs: Transaction<IAssetVote>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const sponsorAddress in transactionAirdropReward.sponsors) {
        if (!transactionAirdropReward.sponsors[sponsorAddress]) {
            continue;
        }
        const rewardAmount = transactionAirdropReward.sponsors[sponsorAddress];

        if (rewardAmount === 0) {
            continue;
        }
        
        AccountRepo.updateBalanceByAddress(parseInt(sponsorAddress, 10), rewardAmount);
        AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, -rewardAmount);
    }
}

export function undoFrozeOrdersRewardAndUnstake(voteTransaction: Transaction<IAssetVote>): void {
    const senderStakes: Array<Stake> = AccountRepo.getByAddress(voteTransaction.senderAddress).stakes;
    const updatedOrders = senderStakes.map((order: Stake) => {
        if (order.nextVoteMilestone === voteTransaction.createdAt + config.constants.froze.vTime * 60) {
            return order;
        }
    });
    undoUnstake(updatedOrders, voteTransaction);
    undoRewards(voteTransaction);
    undoAirdropReward(voteTransaction);
}

function undoUnstake(orders: Array<Stake>, voteTransaction: Transaction<IAssetVote>): void {
    const unstakedOrders = orders.filter(order => !order.isActive);
    unstakedOrders.map((order) => {
        order.isActive = true;
    });
    AccountRepo.updateBalanceByAddress(voteTransaction.senderAddress, -voteTransaction.asset.unstake);
}

function undoRewards(voteTransaction: Transaction<IAssetVote>): void {
    const reward = voteTransaction.asset.reward;
    AccountRepo.updateBalanceByAddress(voteTransaction.senderAddress, -reward);
    AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, reward);
}

function undoAirdropReward(trs: Transaction<IAssetVote | IAssetStake>): void {
    const transactionAirdropReward = trs.asset.airdropReward;

    for (const sponsorAddress in transactionAirdropReward.sponsors) {
        if (!transactionAirdropReward.sponsors[sponsorAddress]) {
            continue;
        }
        const rewardAmount = transactionAirdropReward.sponsors[sponsorAddress];

        if (rewardAmount === 0) {
            continue;
        }

        AccountRepo.updateBalanceByAddress(parseInt(sponsorAddress, 10), -rewardAmount);
        AccountRepo.updateBalanceByAddress(config.config.forging.totalSupplyAccount, rewardAmount);
    }
}
