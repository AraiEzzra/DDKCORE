import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ResponseEntity } from 'shared/model/response';
import { Address, BlockHistoryEvent } from 'shared/model/types';
import AccountRepository from 'core/repository/account';
import { Block } from 'shared/model/block';
import { AccountState, SerializedAccountState, SerializedTransactionHistoryAction } from 'shared/model/types';
import TransactionHistoryRepository from 'core/repository/history/transaction';
import { Transaction } from 'shared/model/transaction';
import BlockHistoryRepository from 'core/repository/history/block';

class SystemController {
    constructor() {
        this.getAccountHistory = this.getAccountHistory.bind(this);
        this.getBlockHistory = this.getBlockHistory.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
    }

    @API(API_ACTION_TYPES.GET_ACCOUNT_HISTORY)
    public getAccountHistory(message: Message2<{ address: Address }>): ResponseEntity<Array<SerializedAccountState>> {
        const account = AccountRepository.getByAddress(BigInt(message.body.address));

        if (!account) {
            return new ResponseEntity({ errors: ['Account not exist'] });
        }

        const response = account.history.map((accountState: AccountState) => ({
            ...accountState,
            state: AccountRepository.serialize(accountState.state, false)
        }));

        return new ResponseEntity({ data: response });
    }

    @API(API_ACTION_TYPES.GET_BLOCK_HISTORY)
    public getBlockHistory(
        message: Message2<{ id: string }>
    ): ResponseEntity<{ events: Array<BlockHistoryEvent>, entity: Block }> {
        const history = BlockHistoryRepository.get(message.body.id);

        if (!history) {
            return new ResponseEntity({ errors: ['Block does not exist'] });
        }

        return new ResponseEntity({ data: history });
    }

    @API(API_ACTION_TYPES.GET_TRANSACTION_HISTORY)
    public getTransactionHistory(
        message: Message2<{ id: string }>
    ): ResponseEntity<{ events: Array<SerializedTransactionHistoryAction>, entity: Transaction<any> }> {
        const history = TransactionHistoryRepository.get(message.body.id);

        if (!history) {
            return new ResponseEntity({ errors: ['Transaction does not exist']});
        }

        const serializedEvents = history.events.map(event => ({
            action: event.action,
            accountStateBefore:
                event.accountStateBefore && AccountRepository.serialize(event.accountStateBefore, false),
            accountStateAfter:
                event.accountStateAfter && AccountRepository.serialize(event.accountStateAfter, false),
        }));

        return new ResponseEntity({ data: { entity: history.entity, events: serializedEvents } });
    }
}

export default new SystemController();
