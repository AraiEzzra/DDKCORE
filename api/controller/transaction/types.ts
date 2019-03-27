import { TransactionType } from 'shared/model/transaction';
import { Pagination, Sort } from 'api/utils/common';

export type getTransactionsRequest = {
    filter: {
        type?: TransactionType,
        block_id?: string,
        sender_public_key?: string,
    },
    sort: Array<Sort>
} & Pagination;
