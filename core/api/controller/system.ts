import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ResponseEntity } from 'shared/model/response';
import {
    AccountState,
    Address,
    BlockHistoryEvent,
    SerializedAccountState,
    SerializedTransactionHistoryAction,
    TransactionId
} from 'shared/model/types';
import AccountRepository from 'core/repository/account';
import TransactionRepository from 'shared/repository/transaction';
import { Block } from 'shared/model/block';
import TransactionHistoryRepository from 'core/repository/history/transaction';
import { IAsset, SerializedTransaction, Transaction } from 'shared/model/transaction';
import BlockHistoryRepository from 'core/repository/history/block';
import TransactionQueue from 'core/service/transactionQueue';
import TransactionPool from 'core/service/transactionPool';
import { uniqueFilterByKey } from 'core/util/transaction';
import { Pagination } from 'shared/util/common';

class SystemController {
    constructor() {
        this.getAccountHistory = this.getAccountHistory.bind(this);
        this.getBlockHistory = this.getBlockHistory.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
        this.getAllUnconfirmedTransactions = this.getAllUnconfirmedTransactions.bind(this);
    }

    @API(API_ACTION_TYPES.GET_ACCOUNT_HISTORY)
    public getAccountHistory(message: Message<{ address: Address }>): ResponseEntity<Array<SerializedAccountState>> {
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
        message: Message<{ id: string }>
    ): ResponseEntity<{ events: Array<BlockHistoryEvent>, entity: Block }> {
        const history = BlockHistoryRepository.get(message.body.id);

        if (!history) {
            return new ResponseEntity({ errors: ['Block does not exist'] });
        }

        return new ResponseEntity({ data: history });
    }

    @API(API_ACTION_TYPES.GET_TRANSACTION_HISTORY)
    public getTransactionHistory(
        message: Message<{ id: string }>
    ): ResponseEntity<{ events: Array<SerializedTransactionHistoryAction>, entity: Transaction<any> }> {
        const history = TransactionHistoryRepository.get(message.body.id);

        if (!history) {
            return new ResponseEntity({ errors: ['Transaction does not exist'] });
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

    @API(API_ACTION_TYPES.GET_ALL_UNCONFIRMED_TRANSACTIONS)
    public getAllUnconfirmedTransactions(
        message: Message<Pagination>
    ): ResponseEntity<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }> {
        const allTransactions = uniqueFilterByKey<TransactionId>('id',
            [...TransactionQueue.getUniqueTransactions(), ...TransactionPool.getTransactions()]
        );
        return new ResponseEntity({
            data: {
                transactions: allTransactions
                    .slice(message.body.offset || 0, (message.body.offset || 0) + message.body.limit)
                    .map(trs => TransactionRepository.serialize(trs)),
                count: allTransactions.length
            }
        });
    }
}

export default new SystemController();
