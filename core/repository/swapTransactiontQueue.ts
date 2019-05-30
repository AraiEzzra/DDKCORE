import { logger } from 'shared/util/logger';
import SocketRepository from 'core/repository/socket';
import { IAsset, SerializedTransaction } from 'shared/model/transaction';


class SwapTransactiontQueue {
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
            SocketRepository.broadcastPeers(
                'TRANSACTION_RECEIVE',
                { trs: serializedTransaction }
            );
        }
    }
}

export default new SwapTransactiontQueue();
