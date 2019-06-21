import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import TransactionPGRepository from 'api/repository/transaction';
import { IAsset, SerializedTransaction, TransactionModel } from 'shared/model/transaction';
import { getTransactionsRequest } from 'api/controller/transaction/types';
import { ResponseEntity } from 'shared/model/response';
import SharedTransactionRepo from 'shared/repository/transaction';
import { validate } from 'shared/validate';
import { DEFAULT_LIMIT, Pagination } from 'shared/util/common';

export class TransactionController {

    constructor() {
        this.createTransaction = this.createTransaction.bind(this);
        this.createPreparedTransaction = this.createPreparedTransaction.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        this.getTransactions = this.getTransactions.bind(this);
        this.getTransactionsByBlockId = this.getTransactionsByBlockId.bind(this);
        this.getTransactionsByHeight = this.getTransactionsByHeight.bind(this);
    }

    @RPC(API_ACTION_TYPES.CREATE_TRANSACTION)
    @validate()
    createTransaction(message: Message<{ secret: string, trs: TransactionModel<IAsset> }>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(API_ACTION_TYPES.CREATE_PREPARED_TRANSACTION)
    @validate()
    createPreparedTransaction(message: Message<{ secret: string, trs: TransactionModel<IAsset> }>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTION)
    @validate()
    async getTransaction(message: Message<{ id: string }>, socket: any): Promise<void> {
        const transaction = await TransactionPGRepository.getOne(message.body.id);
        const data = transaction ? SharedTransactionRepo.serialize(transaction) : null;
        SocketMiddleware.emitToClient<SerializedTransaction<IAsset>>(
            message.headers.id,
            message.code,
            new ResponseEntity<SerializedTransaction<any>>({ data }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTIONS)
    @validate()
    async getTransactions(message: Message<getTransactionsRequest>, socket: any): Promise<void> {
        const transactions = await TransactionPGRepository.getMany(
            message.body.filter || {},
            message.body.sort || [['createdAt', 'ASC']],
            message.body.limit || DEFAULT_LIMIT,
            message.body.offset || 0
        );

        const serializedTransactions =
            transactions.transactions.map(trs => SharedTransactionRepo.serialize(trs));

        SocketMiddleware.emitToClient<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: { transactions: serializedTransactions, count: transactions.count } }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTIONS_BY_BLOCK_ID)
    @validate()
    async getTransactionsByBlockId(message: Message<{ limit: number, offset: number, blockId: string }>, socket: any) {
        const transactions = await TransactionPGRepository.getMany(
            { blockId: message.body.blockId },
            [['type', 'ASC'], ['createdAt', 'ASC'], ['id', 'ASC']],
            message.body.limit || DEFAULT_LIMIT,
            message.body.offset || 0
        );
        const serializedTransactions =
            transactions.transactions.map(trs => SharedTransactionRepo.serialize(trs));

        SocketMiddleware.emitToClient<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: { transactions: serializedTransactions, count: transactions.count } }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTIONS_BY_HEIGHT)
    @validate()
    async getTransactionsByHeight(message: Message<Pagination & { height: number }>, socket: any) {
        const transactions = await TransactionPGRepository.getMany(
            { height: message.body.height },
            [['type', 'ASC'], ['createdAt', 'ASC'], ['id', 'ASC']],
            message.body.limit || DEFAULT_LIMIT,
            message.body.offset || 0
        );

        const serializedTransactions =
            transactions.transactions.map(trs => SharedTransactionRepo.serialize(trs));
        SocketMiddleware.emitToClient<{ transactions: Array<SerializedTransaction<IAsset>>, count: number }>(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: { transactions: serializedTransactions, count: transactions.count } }),
            socket
        );
    }

}

export default new TransactionController();
