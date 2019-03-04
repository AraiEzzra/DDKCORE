import { Transaction, TransactionType, IAsset } from 'shared/model/transaction';
import { IAssetService } from 'core/service/transaction';
import TransactionSendService from '../service/transaction/send';
import TransactionRegisterService from '../service/transaction/register';
import TransactionVoteService from '../service/transaction/vote';
import TransactionDelegateService from '../service/transaction/delegate';
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

export const getTransactionServiceByType = (type: TransactionType): IAssetService<IAsset> => {
    switch (type) {
        case TransactionType.SEND:
            return TransactionSendService;
        case TransactionType.REGISTER:
            return TransactionRegisterService;
        case TransactionType.VOTE:
            return TransactionVoteService;
        case TransactionType.DELEGATE:
            return TransactionDelegateService;
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
