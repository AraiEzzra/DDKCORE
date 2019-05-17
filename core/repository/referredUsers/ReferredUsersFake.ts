import { IReferredUser, IReferredUsers, FactorAction } from 'core/repository/referredUsers/interfaces';
import { Account} from 'shared/model/account';
import { Address } from 'shared/model/types';

export default class ReferredUsersFake implements IReferredUsers {

    add(account: Account) {
    }

    delete(account: Account) {
    }

    updateCountFactor(account: Account, action: FactorAction = FactorAction.ADD) {
    }

    updateRewardFactor(account: Account, sponsors: Map<Address, number>, action: FactorAction = FactorAction.ADD) {
    }

    getUsers(account: Account, level: number): Array<IReferredUser> {
        return [];
    }
}
