import { Transaction, TransactionType } from 'shared/model/transaction';
import { IAssetService } from 'core/service/transaction';
import TransactionSendService from 'core/service/transaction/send';
import TransactionRegisterService from 'core/service/transaction/register';
import TransactionVoteService from 'core/service/transaction/vote';
import TransactionDelegateService from 'core/service/transaction/delegate';
import TransactionStakeService from 'core/service/transaction/stake';
import TransactionSignatureService from 'core/service/transaction/signature';

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

export const getTransactionServiceByType = (type: TransactionType): IAssetService<any> => {
    switch (type) {
        case TransactionType.REGISTER:
            return TransactionRegisterService;
        case TransactionType.SEND:
            return TransactionSendService;
        case TransactionType.SIGNATURE:
            return TransactionSignatureService;
        case TransactionType.DELEGATE:
            return TransactionDelegateService;
        case TransactionType.STAKE:
            return TransactionStakeService;
        case TransactionType.VOTE:
            return TransactionVoteService;
        default:
            return null;
    }
};

export const TRANSACTION_BUFFER_SIZE =
    BUFFER.LENGTH.HEX +         // salt
    BUFFER.LENGTH.BYTE +        // type
    BUFFER.LENGTH.UINT32 +      // createdAt
    BUFFER.LENGTH.HEX +         // senderPublicKey
    BUFFER.LENGTH.DOUBLE_HEX +  // signature
    BUFFER.LENGTH.DOUBLE_HEX;   // secondSignature
