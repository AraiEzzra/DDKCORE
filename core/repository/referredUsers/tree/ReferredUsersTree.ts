import { IReferredUser, IReferredUsers, FactorType, FactorAction } from 'core/repository/referredUsers/interfaces';
import FactorTree from 'core/repository/referredUsers/tree/FactorTree';
import config from 'shared/config/index';
import { Account} from 'shared/model/account';
import { Address } from 'shared/model/types';

export default class ReferredUsersTree implements IReferredUsers {

    private tree: FactorTree<Address>;

    constructor() {
        this.tree = new FactorTree();
    }

    add(account: Account) {
        const node = this.tree.addNode(account.address);

        if (account.referrals.length > 0) {
            const firstReferralAddress = account.referrals[0].address;

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

    updateCountFactor(account: Account, action: FactorAction = FactorAction.ADD) {
        const node = this.tree.getNode(account.address);

        this.tree.eachParents(node, (parent, level) => {
            parent.addFactor(FactorType.COUNT, level, 1, action);
        });
    }

    updateRewardFactor(account: Account, sponsors: Map<Address, number>, action: FactorAction = FactorAction.ADD) {
        const node = this.tree.getNode(account.address);

        this.tree.eachParents(node, (parent, level) => {
            const rewardAmount = sponsors.get(parent.data);
            if (rewardAmount) {
                parent.addFactor(FactorType.REWARD, level, rewardAmount, action);
            }
        });
    }

    getUsers(account: Account, level: number): Array<IReferredUser> {
        const node = this.tree.getNode(account.address);

        if (node !== undefined) {
            return [...node.children.values()].map(item => ({
                address: item.data,
                isEmpty: item.children.size === 0 || level === config.CONSTANTS.REFERRAL.MAX_COUNT - 1,
                factors: item.getFactorsByLevel(level)
            }));
        }

        return [];
    }
}
