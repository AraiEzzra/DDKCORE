import { RPC } from 'api/utils/decorators';
import SocketMiddleware from 'api/middleware/socket';
import { Message2 } from 'shared/model/message';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import TransactionPGRepository from 'api/repository/transaction';
import { IAsset, TransactionModel } from 'shared/model/transaction';
import { getTransactionsRequest } from 'api/controller/transaction/types';
import { DEFAULT_LIMIT } from 'api/utils/common';
import { ResponseEntity } from 'shared/model/response';
import SharedTransactionRepo from 'shared/repository/transaction';
import { validate } from 'shared/validate';
const ALLOWED_FILTERS = new Set(['blockId', 'senderPublicKey', 'type']);
const ALLOWED_SORT = new Set(['blockId', 'createdAt', 'type']);

export class TransactionController {

    constructor() {
        this.createTransaction = this.createTransaction.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        this.getTransactions = this.getTransactions.bind(this);
        this.getTransactionsByBlockId = this.getTransactionsByBlockId.bind(this);
    }

    @RPC(API_ACTION_TYPES.CREATE_TRANSACTION)
    @validate()
    createTransaction(message: Message2<{ secret: string, trs: TransactionModel<IAsset> }>, socket: any) {
        SocketMiddleware.emitToCore(message, socket);
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTION)
    async getTransaction(message: Message2<{ id: string }>, socket: any): Promise<void> {
        SocketMiddleware.emitToClient<TransactionModel<IAsset>>(
            message.headers.id,
            message.code,
            new ResponseEntity({
                data: SharedTransactionRepo.serialize(await TransactionPGRepository.getOne(message.body.id))
            }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTIONS)
    async getTransactions(message: Message2<getTransactionsRequest>, socket: any): Promise<void> {
        // TODO add validation
        const transactions = await TransactionPGRepository.getMany(
            message.body.filter || {},
            message.body.sort || [['createdAt', 'ASC']],
            message.body.limit || DEFAULT_LIMIT,
            message.body.offset || 0
        );

        const serializedTransactions =
            transactions.transactions.map(trs => SharedTransactionRepo.serialize(trs));

        SocketMiddleware.emitToClient<{ transactions: Array<TransactionModel<IAsset>>, count: number }>(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: { transactions: serializedTransactions, count: transactions.count } }),
            socket
        );
    }

    @RPC(API_ACTION_TYPES.GET_TRANSACTIONS_BY_BLOCK_ID)
    async getTransactionsByBlockId(message: Message2<{ limit: number, offset: number, blockId: string }>, socket: any) {
        const transactions = await TransactionPGRepository.getMany(
            { block_id: message.body.blockId },
            [['createdAt', 'ASC']],
            message.body.limit || DEFAULT_LIMIT,
            message.body.offset || 0
        );
        const serializedTransactions =
            transactions.transactions.map(trs => SharedTransactionRepo.serialize(trs));

        SocketMiddleware.emitToClient<{ transactions: Array<TransactionModel<IAsset>>, count: number }>(
            message.headers.id,
            message.code,
            new ResponseEntity({ data: { transactions: serializedTransactions, count: transactions.count } }),
            socket
        );
    }

}

export default new TransactionController();
