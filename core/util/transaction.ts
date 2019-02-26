import { Transaction, TransactionType, IAsset } from 'shared/model/transaction';
import { ITransactionService } from 'core/service/transaction';
import TransactionSendService from '../service/transaction/send';
import BUFFER from 'core/util/buffer';

export const transactionSortFunc = (a: Transaction<any>, b: Transaction<any>): number => {
    if (a.type < b.type) {
        return -1;
    }
    if (a.type > b.type) {
        return 1;
    }
    if (a.createdAt < b.createdAt) {
        return -1;
    }
    if (a.createdAt > b.createdAt) {
        return 1;
    }
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }
    return 0;
};

export const getTransactionServiceByType = (type: TransactionType): ITransactionService<IAsset> => {
    switch (type) {
        case TransactionType.SEND:
            return TransactionSendService;
        default:
            return null;
    }
};

export const TRANSACTION_BUFFER_SIZE =
    BUFFER.LENGTH.HEX +         // salt
    BUFFER.LENGTH.BYTE +        // type
    BUFFER.LENGTH.UINT32 +      // createdAt
    BUFFER.LENGTH.HEX +         // senderPublicKey
    BUFFER.LENGTH.INT64 +       // recipientAddress
    BUFFER.LENGTH.INT64 +       // amount
    BUFFER.LENGTH.DOUBLE_HEX +  // signature
    BUFFER.LENGTH.DOUBLE_HEX;   // secondSignature
