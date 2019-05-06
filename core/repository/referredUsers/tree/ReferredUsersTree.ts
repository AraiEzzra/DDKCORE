import { IReferredUser, IReferredUsers, FactorType } from 'core/repository/referredUsers/interfaces';
import FactorTree from 'core/repository/referredUsers/tree/FactorTree';
import config from 'shared/config/index';
import { Account, Address } from 'shared/model/account';

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

    updateCount(account: Account, count: number = 1): void {
        const node = this.tree.getNode(account.address);

        let parent = node.parent;

        for (let level = config.CONSTANTS.REFERRAL.MAX_COUNT - 1; level >= 0; level--) {
            if (parent === null) {
                break;
            }
            parent.addFactor(FactorType.COUNT, level, count);
            parent = parent.parent;
        }
    }

    getUsers(account: Account, level: number): Array<IReferredUser> {
        const node = this.tree.getNode(account.address);

        if (node !== undefined) {
            return [...node.children.values()].map(node => ({
                address: node.data,
                isEmpty: node.children.size === 0 || level === config.CONSTANTS.REFERRAL.MAX_COUNT - 1,
                factors: node.getFactorsByLevel(level)
            }));
        }

        return [];
    }
}