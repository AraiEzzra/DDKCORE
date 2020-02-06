import { Account as AccountModel } from 'ddk.registry/dist/model/common/account';
import { Stake } from 'ddk.registry/dist/model/common/transaction/stake';
import config from 'shared/config';
import { AccountState, TransactionId } from 'shared/model/types';
import { Airdrop } from 'shared/model/airdrop';
import { isARPEnabled } from 'core/util/feature';

export enum AccountChangeAction {
    TRANSACTION_APPLY_UNCONFIRMED = 'TRANSACTION_APPLY_UNCONFIRMED',
    TRANSACTION_UNDO_UNCONFIRMED = 'TRANSACTION_UNDO_UNCONFIRMED',
    VIRTUAL_UNDO_UNCONFIRMED = 'VIRTUAL_UNDO_UNCONFIRMED',
    MONEY_RECEIVE = 'MONEY_RECEIVE',
    MONEY_RECEIVE_UNDO = 'MONEY_RECEIVE_UNDO',
    AIRDROP_REWARD_RECEIVE = 'AIRDROP_REWARD_RECEIVE',
    AIRDROP_REWARD_RECEIVE_UNDO = 'AIRDROP_REWARD_RECEIVE_UNDO',
    DISTRIBUTE_FEE = 'DISTRIBUTE_FEE',
    DISTRIBUTE_FEE_UNDO = 'DISTRIBUTE_FEE_UNDO',
}

export class Account extends AccountModel {
    referrals: Array<Account>;

    history: Array<AccountState> = [];

    public getCopy(): Account {
        return new Account({ ...this, history: [] });
    }

    addHistory(action: AccountChangeAction, transactionId: TransactionId): void {
        if (!config.CORE.IS_HISTORY || !config.CORE.HISTORY.ACCOUNTS) {
            return;
        }

        this.history.push({
            action,
            state: this.getCopy(),
            transactionId: transactionId
        });
    }

    getActiveStakes = (): Array<Stake> => {
        return this.stakes.filter(stake => stake.isActive);
    }

    getARPActiveStakes = (): Array<Stake> => {
        return this.arp.stakes.filter(stake => stake.isActive);
    }

    getStakes = (): Array<Stake> => {
        return isARPEnabled()
            ? this.arp.stakes
            : this.stakes;
    }

    getTotalStakeAmount = (): number => {
        return this.getStakes().reduce((acc: number, stake: Stake) => {
            if (stake.isActive) {
                acc += stake.amount;
            }
            return acc;
        }, 0);
    }
}
