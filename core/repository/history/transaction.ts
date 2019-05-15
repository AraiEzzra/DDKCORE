import { TransactionHistoryEvent, TransactionId } from 'shared/model/types';
import config from 'shared/config';
import { TransactionLifecycle, Transaction, IAsset } from 'shared/model/transaction';
import { Account } from 'shared/model/account';

import { HistoryRepository } from 'core/repository/history';

class TransactionHistoryRepository extends HistoryRepository<Transaction<any>, TransactionHistoryEvent> {
    addBeforeState(transaction: Transaction<any>, action: TransactionLifecycle, account: Account): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        this.addEvent(transaction, { action, accountStateBefore: account.getCopy() });
    }

    addAfterState(transaction: Transaction<any>, action: TransactionLifecycle, account: Account): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        const history = this.get(transaction.id);

        for (let i = history.events.length - 1; i >= 0; i--) {
            if (history.events[i].action === action) {
                history.events[i].accountStateAfter = account.getCopy();
                break;
            }
        }
    }
}

export default new TransactionHistoryRepository();
