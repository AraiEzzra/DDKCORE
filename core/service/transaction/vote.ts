import DDK from 'ddk.registry';
import { createAssetVote } from 'ddk.registry/dist/service/transaction/vote';
import { Stake } from 'ddk.registry/dist/model/common/transaction/stake';
import { AssetVote } from 'ddk.registry/dist/model/common/transaction/asset/vote';
import { IAssetService } from 'core/service/transaction';
import {
    IAssetVote,
    Transaction,
    TransactionModel,
    VoteType,
} from 'shared/model/transaction';
import { Account } from 'shared/model/account';
import { ResponseEntity } from 'shared/model/response';
import AccountRepo from 'core/repository/account';
import config from 'shared/config';
import BUFFER from 'core/util/buffer';
import {
    applyFrozeOrdersRewardAndUnstake,
    sendAirdropReward,
    undoAirdropReward,
    undoFrozeOrdersRewardAndUnstake,
    verifyAirdrop,
    isSponsorsExist,
} from 'core/util/reward';
import { TOTAL_PERCENTAGE } from 'core/util/const';
import { PublicKey } from 'shared/model/types';
import BlockRepository from 'core/repository/block';
import FailService from 'core/service/fail';

class TransactionVoteService implements IAssetService<IAssetVote> {
    private calculateVoteAsset(trs: TransactionModel<IAssetVote>, sender: Account): AssetVote {
        const isDownVote: boolean = trs.asset.votes[0][0] === '-';
        const voteType = isDownVote ? VoteType.DOWN_VOTE : VoteType.VOTE;
        const lastBlock = BlockRepository.getLastBlock();
        const airdropAccount = AccountRepo.getByAddress(config.CONSTANTS.AIRDROP.ADDRESS);
        const arpAccount = AccountRepo.getByAddress(BigInt(DDK.config.ARP.ADDRESS));

        return createAssetVote(
            { createdAt: trs.createdAt, type: voteType, votes: trs.asset.votes },
            sender,
            lastBlock.height,
            airdropAccount.actualBalance,
            arpAccount.actualBalance,
        );
    }

    create(trs: TransactionModel<IAssetVote>): IAssetVote {
        const sender: Account = AccountRepo.getByAddress(trs.senderAddress);
        const asset = this.calculateVoteAsset(trs, sender);

        return {
            votes: trs.asset.votes.map((vote: string) => `${trs.asset.type}${vote}`),
            reward: asset.reward || 0,
            unstake: asset.unstake || 0,
            airdropReward: asset.airdropReward,
        };
    }

    getBytes(trs: Transaction<IAssetVote>): Buffer {
        let offset = 0;
        const buff: Uint8Array = Buffer.alloc(
            BUFFER.LENGTH.INT64 + // reward
            BUFFER.LENGTH.INT64   // unstake
        );

        offset = BUFFER.writeUInt64LE(buff, trs.asset.reward, offset);
        offset = BUFFER.writeUInt64LE(buff, trs.asset.unstake, offset);

        // airdropReward.sponsors up to 15 sponsors
        const sponsorsBuffer = Buffer.alloc(
            (BUFFER.LENGTH.INT64 + BUFFER.LENGTH.INT64) * config.CONSTANTS.REFERRAL.MAX_COUNT);

        offset = 0;

        for (const [sponsorAddress, reward] of trs.asset.airdropReward.sponsors) {
            offset = BUFFER.writeUInt64LE(sponsorsBuffer, sponsorAddress, offset);
            offset = BUFFER.writeUInt64LE(sponsorsBuffer, reward || 0, offset);
        }

        const voteBuffer = trs.asset.votes ? Buffer.from(trs.asset.votes.join(''), 'utf8') : Buffer.from([]);
        return Buffer.concat([buff, sponsorsBuffer, voteBuffer]);
    }

    validate(trs: Transaction<IAssetVote>): ResponseEntity<void> {
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

        if (trs.asset.votes && trs.asset.votes.length > config.CONSTANTS.MAX_VOTES_PER_TRANSACTION) {
            errors.push([
                'Voting limit exceeded. Maximum is',
                config.CONSTANTS.MAX_VOTES_PER_TRANSACTION,
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

            if (vote.length !== config.CONSTANTS.SIGNATURE_LENGTH) {
                votesErrors.push('Invalid vote length');
            }
        });
        if (votesErrors.length) {
            errors.push(...votesErrors);
        }

        const uniqVotes = trs.asset.votes.reduce((publicKeys: Array<string>, vote: string) => {
            const publicKey: string = vote.slice(1);
            if (publicKeys.indexOf(publicKey) === -1) {
                publicKeys.push(publicKey);
            }
            return publicKeys;
        }, []);

        if (trs.asset.votes.length > uniqVotes.length) {
            errors.push('Multiple votes for same delegate are not allowed');
        }

        return new ResponseEntity<void>({ errors });
    }

    verifyUnconfirmed(trs: Transaction<IAssetVote>, sender: Account): ResponseEntity<void> {
        const errors: Array<string> = [];
        if (
            BlockRepository.getLastBlock().height > config.CONSTANTS.START_FEATURE_BLOCK.VOTE_WITH_ACTIVE_STAKE &&
            !sender.getActiveStakes().length &&
            !sender.getARPActiveStakes().length
        ) {
            errors.push(`No active stakes`);
            return new ResponseEntity<void>({ errors });
        }

        const voteAsset = this.calculateVoteAsset(trs, sender);

        if (FailService.isFailedVoteReward(trs)) {
            trs.asset.reward = voteAsset.reward;
        }

        if (voteAsset.reward !== trs.asset.reward) {
            errors.push(
                `Verify failed: vote reward is corrupted, expected: ${trs.asset.reward}, actual: ${voteAsset.reward}`
            );
        }

        if (voteAsset.unstake !== trs.asset.unstake) {
            errors.push(
                `Verify failed: vote unstake is corrupted, expected: ${trs.asset.unstake}, actual: ${voteAsset.unstake}`
            );
        }

        const verifyAirdropResponse: ResponseEntity<void> = verifyAirdrop(trs, voteAsset.reward, sender);
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
                default:
                    errors.push('Invalid math operator for vote' + vote);
            }

            const account = AccountRepo.getByPublicKey(publicKey);
            if (!account) {
                errors.push('Account not found, vote: ' + vote);
            } else if (!account.delegate) {
                errors.push('Delegate not found, vote: ' + vote);
            }
        });

        const totalVotes: number = (senderVotes.length + additions) - removals;

        if (totalVotes > config.CONSTANTS.MAX_VOTES) {
            const exceeded = totalVotes - config.CONSTANTS.MAX_VOTES;

            errors.push(`Maximum number of votes possible ${config.CONSTANTS.MAX_VOTES}, exceeded by ${exceeded}`);
        }

        return new ResponseEntity<void>({ errors });
    }

    calculateFee(trs: Transaction<IAssetVote>, sender: Account): number {
        const senderTotalFrozeAmount = sender.stakes.reduce((acc: number, stake: Stake) => {
            if (stake.isActive) {
                acc += stake.amount;
            }
            return acc;
        }, 0);
        return senderTotalFrozeAmount * config.CONSTANTS.FEES.VOTE / TOTAL_PERCENTAGE;
    }

    applyUnconfirmed(trs: Transaction<IAssetVote>, sender: Account): void {
        const isDownVote = trs.asset.votes[0][0] === '-';
        const votes = trs.asset.votes.map(vote => vote.substring(1));
        if (isDownVote) {
            votes.reduce((publicKeys: Array<string>, delegatePublicKey: string) => {
                const delegateAccount: Account = AccountRepo.getByPublicKey(delegatePublicKey);
                delegateAccount.delegate.votes--;
                publicKeys.splice(publicKeys.indexOf(delegatePublicKey), 1);
                return publicKeys;
            }, sender.votes);
        } else {
            votes.forEach((delegatePublicKey) => {
                const delegateAccount: Account = AccountRepo.getByPublicKey(delegatePublicKey);
                delegateAccount.delegate.votes++;
            });
            sender.votes.push(...votes);
        }

        if (isDownVote) {
            return;
        }

        const processedOrders: Array<Stake> = [];
        sender.stakes
            .filter(stake => stake.isActive && trs.createdAt >= stake.nextVoteMilestone)
            .forEach((stake: Stake) => {
                stake.voteCount++;
                stake.previousMilestones.push(stake.nextVoteMilestone);
                stake.nextVoteMilestone = trs.createdAt + config.CONSTANTS.FROZE.VOTE_MILESTONE;
                processedOrders.push(stake);
            });
        applyFrozeOrdersRewardAndUnstake(trs, processedOrders);
        if (isSponsorsExist(trs)) {
            sendAirdropReward(trs);
        }
    }

    undoUnconfirmed(trs: Transaction<IAssetVote>, sender: Account, senderOnly: boolean): void {
        const isDownVote = trs.asset.votes[0][0] === '-';
        const votes = trs.asset.votes.map(vote => vote.substring(1));
        if (isDownVote) {
            sender.votes.push(...votes);
            if (!senderOnly) {
                votes.forEach((newVote) => {
                    const delegateAccount: Account = AccountRepo.getByPublicKey(newVote);
                    delegateAccount.delegate.votes++;
                });
            }
        } else {
            votes.forEach((vote: PublicKey) => {
                sender.votes.splice(sender.votes.indexOf(vote), 1);
                if (!senderOnly) {
                    const delegateAccount: Account = AccountRepo.getByPublicKey(vote);
                    delegateAccount.delegate.votes--;
                }
            });
        }

        if (isDownVote) {
            return;
        }

        undoFrozeOrdersRewardAndUnstake(trs, sender, senderOnly);
        if (!senderOnly && isSponsorsExist(trs)) {
            undoAirdropReward(trs);
        }

        sender.stakes
            .filter(stake =>
                stake.isActive &&
                trs.createdAt + config.CONSTANTS.FROZE.VOTE_MILESTONE === stake.nextVoteMilestone
            )
            .forEach((stake: Stake) => {
                stake.voteCount--;
                stake.nextVoteMilestone = stake.previousMilestones.pop();
            });
    }

    apply(trs: Transaction<IAssetVote>): void {
        const isDownVote = trs.asset.votes[0][0] === '-';
        const delegatesPublicKeys = trs.asset.votes.map(vote => vote.substring(1));
        if (isDownVote) {
            delegatesPublicKeys.forEach((delegatePublicKey: string) => {
                AccountRepo.getByPublicKey(delegatePublicKey).delegate.confirmedVoteCount--;
            });
        } else {
            delegatesPublicKeys.forEach((delegatePublicKey) => {
                AccountRepo.getByPublicKey(delegatePublicKey).delegate.confirmedVoteCount++;
            });
        }
    }

    undo(trs: Transaction<IAssetVote>): void {
        const isDownVote = trs.asset.votes[0][0] === '-';
        const delegatesPublicKeys = trs.asset.votes.map(vote => vote.substring(1));
        if (isDownVote) {
            delegatesPublicKeys.forEach((delegatePublicKey) => {
                AccountRepo.getByPublicKey(delegatePublicKey).delegate.confirmedVoteCount++;
            });
        } else {
            delegatesPublicKeys.forEach((delegatePublicKey: PublicKey) => {
                AccountRepo.getByPublicKey(delegatePublicKey).delegate.confirmedVoteCount--;
            });
        }
    }
}

export default new TransactionVoteService();
