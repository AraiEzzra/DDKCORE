import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ResponseEntity } from 'shared/model/response';
import { Address } from 'shared/model/types';
import BlockRepository from 'core/repository/block';
import TransactionRepository from 'core/repository/transaction';
import AccountRepository from 'core/repository/account';
import { Block } from 'shared/model/block';
import { AccountState, SerializedAccountState, SerializedTransactionHistoryAction } from 'shared/model/types';

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
            state: AccountRepository.serialize(accountState.state)
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
        const transaction = TransactionRepository.getById(message.body.id);

        if (!transaction) {
            return new ResponseEntity({ errors: ['Transaction not exist']});
        }

        const response = transaction.history.map(trsHistory => ({
            action: trsHistory.action,
            accountStateBefore:
                trsHistory.accountStateBefore && AccountRepository.serialize(trsHistory.accountStateBefore),
            accountStateAfter:
                trsHistory.accountStateAfter && AccountRepository.serialize(trsHistory.accountStateAfter),
        }));

        return new ResponseEntity({ data: response });
    }
}

export default new SystemController();
