import DDK from 'ddk.registry';
import { Stake } from 'ddk.registry/dist/model/common/transaction/stake';
import { createAssetStake } from 'ddk.registry/dist/service/transaction/stake';
import { createAssetVote } from 'ddk.registry/dist/service/transaction/vote';
import { VoteType, AirdropReward } from 'ddk.registry/dist/model/common/type';
import { Account, AccountChangeAction } from 'shared/model/account';
import config from 'shared/config';
import {
    IAssetStake,
    IAssetVote,
    Transaction,
    TransactionType,
} from 'shared/model/transaction';
import AccountRepo from 'core/repository/account';
import ReferredUsersRepo, { ReferredUserFactor } from 'core/repository/referredUsers';
import { ResponseEntity } from 'shared/model/response';
import { isEqualMaps } from 'core/util/common';
import { FactorAction } from 'core/repository/referredUsers/interfaces';
import BlockRepository from 'core/repository/block';

export const verifyAirdrop = (
    trs: Transaction<any>,
    amount: number,
    sender: Account
): ResponseEntity<void> => {
    const lastBlock = BlockRepository.getLastBlock();
    const airdropAccount = AccountRepo.getByAddress(config.CONSTANTS.AIRDROP.ADDRESS);
    const arpAccount = AccountRepo.getByAddress(BigInt(DDK.config.ARP.ADDRESS));

    let airdropReward: AirdropReward;
    if (trs.type === TransactionType.STAKE) {
        airdropReward = createAssetStake(
            trs.asset,
            sender,
            lastBlock.height,
            airdropAccount.actualBalance,
            arpAccount.actualBalance,
        ).airdropReward;
    } else {
        const isDownVote: boolean = trs.asset.votes[0][0] === '-';
        const voteType = isDownVote ? VoteType.DOWN_VOTE : VoteType.VOTE;

        airdropReward = createAssetVote(
            { createdAt: trs.createdAt, type: voteType, votes: trs.asset.votes },
            sender,
            lastBlock.height,
            airdropAccount.actualBalance,
            arpAccount.actualBalance,
        ).airdropReward;
    }

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

    ReferredUsersRepo.updateStakeAmountFactor(trs.senderAddress, trs.asset.unstake, FactorAction.SUBTRACT);
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

    ReferredUsersRepo.updateRewardFactor(trs);
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

    ReferredUsersRepo.updateRewardFactor(trs, ReferredUserFactor.ACTION.SUBTRACT);
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

    ReferredUsersRepo.updateStakeAmountFactor(sender.address, trs.asset.unstake, FactorAction.ADD);
}

function undoRewards(trs: Transaction<IAssetVote>, sender: Account, senderOnly: boolean): void {
    sender.actualBalance -= trs.asset.reward;
    if (!senderOnly) {
        AccountRepo.updateBalanceByAddress(config.CONSTANTS.TOTAL_SUPPLY.ADDRESS, trs.asset.reward);
    }
}
