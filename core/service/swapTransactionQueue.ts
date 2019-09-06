import { logger } from 'shared/util/logger';

import { IAsset, SerializedTransaction } from 'shared/model/transaction';
import PeerService from 'core/service/peer';
import { ActionTypes } from 'core/util/actionTypes';


class SwapTransactionQueue {
    pool: Array<SerializedTransaction<IAsset>>;

    constructor() {
        this.pool = [];
    }

    push(data: SerializedTransaction<IAsset>) {
        logger.debug(`[Repository][SwapTransactionQueue][push]`);
        this.pool.unshift(data);
    }

    get size(): number {
        return this.pool.length;
    }

    process(): void {
        while (this.pool.length > 0) {
            const serializedTransaction = this.pool.pop();
            PeerService.broadcast(
                ActionTypes.TRANSACTION_RECEIVE,
                { trs: serializedTransaction },
                null,
                false,
            );
        }
    }
}

export default new SwapTransactionQueue();
