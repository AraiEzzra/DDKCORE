import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ResponseEntity } from 'shared/model/response';
import { Address } from 'shared/model/types';
import BlockRepository from 'core/repository/block';
import AccountRepository from 'core/repository/account';
import { Block } from 'shared/model/block';
import { AccountState, SerializedAccountState, SerializedTransactionHistoryAction } from 'shared/model/types';
import TransactionHistoryRepository from 'core/repository/history/transaction';

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
    public getBlockHistory(message: Message2<{ id: string }>): ResponseEntity<Block> {
        const block = BlockRepository.getById(message.body.id);

        return new ResponseEntity({ data: block });
    }

    @API(API_ACTION_TYPES.GET_TRANSACTION_HISTORY)
    public getTransactionHistory(
        message: Message2<{ id: string }>
    ): ResponseEntity<Array<SerializedTransactionHistoryAction>> {
        const history = TransactionHistoryRepository.get(message.body.id);

        if (!history) {
            return new ResponseEntity({ errors: ['Transaction not exist']});
        }

        const response = history.map(event => ({
            action: event.action,
            accountStateBefore:
                event.accountStateBefore && AccountRepository.serialize(event.accountStateBefore),
            accountStateAfter:
                event.accountStateAfter && AccountRepository.serialize(event.accountStateAfter),
        }));

        return new ResponseEntity({ data: response });
    }
}

export default new SystemController();
