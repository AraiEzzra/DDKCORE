import { IAssetService } from 'core/service/transaction';
import {IAirdropAsset, IAssetVote, Transaction, TransactionModel} from 'shared/model/transaction';
import { Account, Stake } from 'shared/model/account';
import Response from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/util/config';
import BUFFER from 'core/util/buffer';
import {
    calculateTotalRewardAndUnstake,
    getAirdropReward,
    verifyAirdrop,
    applyFrozeOrdersRewardAndUnstake,
    undoFrozeOrdersRewardAndUnstake,
    sendAirdropReward,
    undoAirdropReward
} from 'core/util/reward';
import DelegateRepo from 'core/repository/delegate';
import { SECONDS_PER_MINUTE, TOTAL_PERCENTAGE } from 'core/util/const';

class TransactionVoteService implements IAssetService<IAssetVote> {

    create(trs: TransactionModel<IAssetVote>): IAssetVote {
        const sender: Account = AccountRepo.getByAddress(trs.senderAddress);
        const isDownVote: boolean = trs.asset.votes[0][0] === '-';
        const totals: { reward: number, unstake: number} = calculateTotalRewardAndUnstake(sender, isDownVote);
        const airdropReward: IAirdropAsset = getAirdropReward(sender, totals.reward, trs.type);

        trs.asset = {
            votes: trs.asset.votes,
            reward: totals.reward || 0,
            unstake: totals.unstake || 0,
            airdropReward: airdropReward
        };
        return trs.asset;
    }

    getBytes(trs: Transaction<IAssetVote>): Buffer {
        let offset = 0;
        const buff: Uint8Array = Buffer.alloc(
            BUFFER.LENGTH.INT64 + // reward
            BUFFER.LENGTH.INT64   // unstake
        );

        offset = BUFFER.writeUInt64LE(buff, trs.asset.reward, offset);
        offset = BUFFER.writeUInt64LE(buff, trs.asset.unstake ? (trs.asset.unstake * -1) : 0, offset);

        // airdropReward.sponsors up to 15 sponsors
        const sponsorsBuffer = Buffer.alloc(
            (BUFFER.LENGTH.INT64 + BUFFER.LENGTH.INT64) * config.constants.airdrop.maxReferralCount);

        offset = 0;

        for (const [sponsorAddress, reward] of trs.asset.airdropReward.sponsors) {
            offset = BUFFER.writeUInt64LE(sponsorsBuffer, sponsorAddress, offset);
            offset = BUFFER.writeUInt64LE(sponsorsBuffer, reward || 0, offset);
        }

        const voteBuffer = trs.asset.votes ? Buffer.from(trs.asset.votes.join(''), 'utf8') : Buffer.from([]);
        return Buffer.concat([buff, sponsorsBuffer, voteBuffer]);
    }

    validate(trs: Transaction<IAssetVote>): Response<void> {
        const errors: Array<string> = [];

        if (!trs.asset || !trs.asset.votes) {
            errors.push('Invalid transaction asset');
        }

        if (!Array.isArray(trs.asset.votes)) {
            errors.push('Invalid votes. Must be an array');
        }

        if (!trs.asset.votes.length) {
            errors.push('Invalid votes. Must not be empty');
        }

        if (trs.asset.votes && trs.asset.votes.length > config.constants.maxVotesPerTransaction) {
            errors.push([
                'Voting limit exceeded. Maximum is',
                config.constants.maxVotesPerTransaction,
                'votes per transaction'
            ].join(' '));
        }

        const votesErrors: Array<string> = [];
        trs.asset.votes.forEach((vote) => {
            if (typeof vote !== 'string') {
                votesErrors.push('Invalid vote type');
            }

            if (!/[-+]{1}[0-9a-z]{64}/.test(vote)) {
                votesErrors.push('Invalid vote format');
            }

            if (vote.length !== config.constants.signatureLength) {
                votesErrors.push('Invalid vote length');
            }
        });
        if (votesErrors.length) {
            errors.push(...votesErrors);
        }

        const uniqVotes = trs.asset.votes.reduce((acc: Array<string>, vote: string) => {
            const slicedVote: string = vote.slice(1);
            if (acc.indexOf(slicedVote) === -1) {
                acc.push(slicedVote);
            }
            return acc;
        }, []);
        if (trs.asset.votes.length > uniqVotes.length) {
            errors.push('Multiple votes for same delegate are not allowed');
        }

        return new Response({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetVote>, sender: Account): Response<void> {
        const errors: Array<string> = [];

        const isDownVote: boolean = trs.asset.votes[0][0] === '-';
        const totals: { reward: number, unstake: number} = calculateTotalRewardAndUnstake(sender, isDownVote);

        if (totals.reward !== trs.asset.reward) {
            errors.push(
                `Verify failed: vote reward is corrupted, expected: ${totals.reward}, actual: ${trs.asset.reward}`
            );
        }

        if (totals.unstake !== trs.asset.unstake) {
            errors.push(
                `Verify failed: vote unstake is corrupted, expected: ${totals.unstake}, actual: ${trs.asset.unstake}`
            );
        }

        const verifyAirdropResponse: Response<void> = verifyAirdrop(trs, totals.reward, sender);
        if (!verifyAirdropResponse.success) {
            errors.push(...verifyAirdropResponse.errors);
        }

        let additions: number = 0;
        let removals: number = 0;
        const senderVotes: Array<string> = sender.votes || [];
        trs.asset.votes.forEach((vote) => {
            const sign: string = vote[0];
            const publicKey: string = vote.slice(1);
            switch (sign) {
                case '+': {
                    if (senderVotes.indexOf(publicKey) !== -1) {
                        errors.push('Failed to add vote, account has already voted for this delegate, vote: ' + vote);
                        break;
                    }
                    additions++;
                    break;
                }
                case '-': {
                    if (senderVotes.length < 1 || senderVotes.indexOf(publicKey) === -1) {
                        errors.push('Failed to remove vote, account has not voted for this delegate, vote: ' + vote);
                        break;
                    }
                    removals++;
                    break;
                }
                default: errors.push('Invalid math operator for vote' + vote);
            }
            if (!AccountRepo.getByPublicKey(publicKey).delegate) {
                errors.push('Delegate not found, vote: ' + vote);
            }
        });

        const totalVotes: number = (senderVotes.length + additions) - removals;

        if (totalVotes > config.constants.maxVotes) {
            const exceeded = totalVotes - config.constants.maxVotes;

            errors.push(`Maximum number of votes possible ${config.constants.maxVotes}, exceeded by ${exceeded}`);
        }
        return new Response({ errors });
    }

    calculateFee(trs: Transaction<IAssetVote>, sender: Account): number {
        const senderTotalFrozeAmount = sender.stakes.reduce((acc: number, stake: Stake) => {
            if (stake.isActive) {
                acc += stake.amount;
            }
            return acc;
        }, 0);
        return senderTotalFrozeAmount * config.constants.fees.vote / TOTAL_PERCENTAGE;
    }


    applyUnconfirmed(trs: Transaction<IAssetVote>, sender: Account): void {
        const isDownVote = trs.asset.votes[0][0] === '-';
        const votes = trs.asset.votes.map(vote => vote.substring(1));
        if (isDownVote) {
            votes.reduce((acc: Array<string>, newVote: string) => {
                const targetAccount: Account = AccountRepo.getByPublicKey(newVote);
                targetAccount.delegate.votes--;
                DelegateRepo.update(targetAccount.delegate);
                acc.splice(acc.indexOf(newVote), 1);
                return acc;
            }, sender.votes);
        } else {
            votes.forEach((newVote) => {
                const targetAccount: Account = AccountRepo.getByPublicKey(newVote);
                targetAccount.delegate.votes++;
                DelegateRepo.update(targetAccount.delegate);
            });
            sender.votes.push(...votes);
        }
        AccountRepo.updateVotes(sender, sender.votes);

        if (isDownVote) {
            return;
        }

        const processedOrders: Array<Stake> = [];
        sender.stakes.forEach((stake: Stake) => {
            if (stake.isActive && (stake.nextVoteMilestone === 0 || trs.createdAt > stake.nextVoteMilestone)) {
                stake.voteCount++;
                stake.nextVoteMilestone = trs.createdAt + config.constants.froze.vTime * SECONDS_PER_MINUTE;
                processedOrders.push(stake);
            }
        });
        if (processedOrders && processedOrders.length > 0) {
            applyFrozeOrdersRewardAndUnstake(trs, processedOrders);
            sendAirdropReward(trs);
        }
    }

    undoUnconfirmed(trs: Transaction<IAssetVote>, sender: Account, senderOnly): void {
        const isDownVote = trs.asset.votes[0][0] === '-';
        const votes = trs.asset.votes.map(vote => vote.substring(1));
        if (isDownVote) {
            votes.forEach((newVote) => {
                const targetAccount: Account = AccountRepo.getByPublicKey(newVote);
                targetAccount.delegate.votes++;
                DelegateRepo.update(targetAccount.delegate);
            });
            sender.votes.push(...votes);
        } else {
            votes.reduce((acc: Array<string>, newVote: string) => {
                const targetAccount: Account = AccountRepo.getByPublicKey(newVote);
                targetAccount.delegate.votes--;
                DelegateRepo.update(targetAccount.delegate);
                acc.splice(acc.indexOf(newVote), 1);
                return acc;
            }, sender.votes);
        }
        AccountRepo.updateVotes(sender, sender.votes);

        if (isDownVote) {
            return;
        }

        sender.stakes.forEach((stake: Stake) => {
            if (stake.isActive && (stake.nextVoteMilestone === 0 ||
                trs.createdAt + (config.constants.froze.vTime * SECONDS_PER_MINUTE) === stake.nextVoteMilestone)) {
                stake.voteCount--;
                stake.nextVoteMilestone = 0;
            }
        });
        undoFrozeOrdersRewardAndUnstake(trs);
        undoAirdropReward(trs);
    }
}

export default new TransactionVoteService();
