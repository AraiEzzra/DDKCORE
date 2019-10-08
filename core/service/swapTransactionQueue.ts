import { logger } from 'shared/util/logger';

import PeerService from 'core/service/peer';
import { ActionTypes } from 'core/util/actionTypes';


class SwapTransactionQueue {
    pool: Array<Buffer>;

    constructor() {
        this.pool = [];
    }

    push(data: Buffer) {
        logger.debug(`[Repository][SwapTransactionQueue][push]`);
        this.pool.unshift(data);
    }

    get size(): number {
        return this.pool.length;
    }

    process(): void {
        while (this.pool.length > 0) {
            const bufferTransaction = this.pool.pop();
            PeerService.broadcast(
                ActionTypes.TRANSACTION_RECEIVE,
                bufferTransaction,
                null,
                false,
            );
        }
    }
}

export default new SwapTransactionQueue();
