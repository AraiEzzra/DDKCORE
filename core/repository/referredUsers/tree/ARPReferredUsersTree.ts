import AirdropReferredUsersTree from 'core/repository/referredUsers/tree/AirdropReferredUsersTree';
import { Account } from 'shared/model/account';
import { Stake } from 'shared/model/transaction';

export default class ARPReferredUsersTree extends AirdropReferredUsersTree {

    protected getAccountReferrals(account: Account): Array<Account> {
        return account.arp.referrals;
    }

    protected getAccountActiveStakes(account: Account): Array<Stake> {
        return account.arp.stakes.filter(stake => stake.isActive);
    }

}
