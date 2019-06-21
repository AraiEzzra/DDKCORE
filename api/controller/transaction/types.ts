import { TransactionType } from 'shared/model/transaction';
import { Pagination, Sort } from 'shared/util/common';

export type getTransactionsRequest = {
    filter: {
        type?: TransactionType,
        blockId?: string,
        senderPublicKey?: string,
    },
    sort: Array<Sort>
} & Pagination;
