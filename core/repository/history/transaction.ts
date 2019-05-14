import { TransactionHistoryEvent, TransactionId } from 'shared/model/types';
import config from 'shared/config';
import { TransactionLifecycle } from 'shared/model/transaction';
import { Account } from 'shared/model/account';

import { HistoryRepository } from 'core/repository/history';

class TransactionHistoryRepository extends HistoryRepository<TransactionHistoryEvent> {
    addBeforeState(id: TransactionId, action: TransactionLifecycle, account: Account): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        if (!this.get(id)) {
            this.add(id, { action, accountStateBefore: account.getCopy() });
        }
    }

    addAfterState(id: TransactionId, action: TransactionLifecycle, account: Account): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        const history = this.get(id) || this.add(id, { action });

        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].action === action) {
                history[i].accountStateAfter = account.getCopy();
                break;
            }
        }
    }
}

export default new TransactionHistoryRepository();
