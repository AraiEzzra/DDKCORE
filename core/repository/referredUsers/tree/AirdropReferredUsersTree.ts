import { FactorAction, FactorType, IReferredUser, IReferredUsers } from 'core/repository/referredUsers/interfaces';
import { AirdropHistory, IAirdropHistoryRepository } from 'core/repository/airdropHistory';
import FactorTree from 'core/repository/referredUsers/tree/FactorTree';
import config from 'shared/config';
import { Account } from 'shared/model/account';
import { Address } from 'shared/model/types';
import { IAssetRegister, IAssetStake, IAssetVote, Transaction, Stake } from 'shared/model/transaction';
import AccountRepository from 'core/repository/account';

export default class AirdropReferredUsersTree implements IReferredUsers {

    private tree: FactorTree<Address>;

    private airdropHistoryRepository: IAirdropHistoryRepository;

    constructor(airdropHistoryRepository: IAirdropHistoryRepository) {
        this.airdropHistoryRepository = airdropHistoryRepository;
        this.tree = new FactorTree();
    }

    protected getAccountReferrals(account: Account): Array<Account> {
        return account.referrals;
    }

    protected getAccountActiveStakes(account: Account): Array<Stake> {
        return account.stakes.filter(stake => stake.isActive);
    }

    add(account: Account) {
        const node = this.tree.addNode(account.address);
        const referrals = this.getAccountReferrals(account);

        if (referrals.length > 0) {
            const firstReferralAddress = referrals[0].address;

            let root = this.tree.getNode(firstReferralAddress);

            if (root === undefined) {
                root = this.tree.addNode(firstReferralAddress);
            }

            root.addChild(node);
        }
    }

    delete(account: Account) {
        this.tree.removeNode(account.address);
    }

    updateCountFactor(trs: Transaction<IAssetRegister>, action: FactorAction = FactorAction.ADD) {
        const node = this.tree.getNode(trs.senderAddress);

        this.tree.eachParents(node, (parent, level) => {
            parent.addFactor(FactorType.COUNT, level, 1, action);
        });
    }

    updateStakeAmountFactor(address: Address, amount: number, action: FactorAction = FactorAction.ADD) {
        const node = this.tree.getNode(address);

        if (node) {
            node.addFactor(FactorType.STAKE_AMOUNT, 0, amount, action);
        }
    }

    updateRewardFactor(trs: Transaction<IAssetStake | IAssetVote>, action: FactorAction = FactorAction.ADD) {
        const node = this.tree.getNode(trs.senderAddress);
        const { sponsors } = trs.asset.airdropReward;

        this.tree.eachParents(node, (parent, level) => {
            const rewardAmount = sponsors.get(parent.data);
            if (rewardAmount) {
                parent.addFactor(FactorType.REWARD, level, rewardAmount, action);

                const airdropHistory = {
                    referralAddress: parent.data,
                    transactionId: trs.id,
                    transactionType: trs.type,
                    rewardAmount,
                    rewardTime: trs.createdAt,
                    sponsorAddress: trs.senderAddress,
                    sponsorLevel: level
                };

                this.updateAirdropHistory(airdropHistory, action);
            }
        });
    }

    private updateAirdropHistory(data: AirdropHistory, action: FactorAction = FactorAction.ADD) {
        switch (action) {
            case FactorAction.ADD:
                this.airdropHistoryRepository.add(data);
                break;
            case FactorAction.SUBTRACT:
                this.airdropHistoryRepository.remove(data);
                break;
            default:
        }
    }

    getUsers(account: Account, level: number): Array<IReferredUser> {
        if (level === config.CONSTANTS.REFERRAL.MAX_COUNT + 1) {
            return [];
        }

        const node = this.tree.getNode(account.address);
        if (!node) {
            return [];
        }

        return [...node.children.values()].map(item => {
            const referredAccount = AccountRepository.getByAddress(item.data);

            return {
                address: item.data,
                stakeAmount: this.getAccountActiveStakes(referredAccount)
                    .reduce((accumulator, stake) => accumulator + stake.amount, 0),
                isEmpty: item.children.size === 0 || level === config.CONSTANTS.REFERRAL.MAX_COUNT,
                factors: item.getFactorsByLevel(level),
            };
        });
    }
}
