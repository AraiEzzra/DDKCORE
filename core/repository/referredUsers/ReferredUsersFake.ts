import { IReferredUser, IReferredUsers, FactorAction } from 'core/repository/referredUsers/interfaces';
import { Account} from 'shared/model/account';
import { IAssetRegister, IAssetStake, IAssetVote, Transaction } from 'shared/model/transaction';

export default class ReferredUsersFake implements IReferredUsers {

    add(account: Account) {
    }

    delete(account: Account) {
    }

    updateCountFactor(trs: Transaction<IAssetRegister>, action: FactorAction = FactorAction.ADD) {
    }

    updateRewardFactor(trs: Transaction<IAssetStake | IAssetVote>, action: FactorAction = FactorAction.ADD) {
    }

    getUsers(account: Account, level: number): Array<IReferredUser> {
        return [];
    }
}
