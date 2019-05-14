import { Timestamp, BlockHistoryEvent, BlockHistoryState } from 'shared/model/types';
import { Transaction, BlockLifecycle } from 'shared/model/transaction';
import config from 'shared/config';

export class BlockModel {
    id?: string | null = null;
    version?: number = config.CONSTANTS.FORGING.CURRENT_BLOCK_VERSION;
    createdAt: Timestamp;
    height?: number | null = null;
    previousBlockId: string | null;
    transactionCount?: number = 0;
    amount?: number = 0;
    fee?: number = 0;
    payloadHash?: string = '';
    generatorPublicKey?: string = '';
    signature?: string = '';
    relay?: number; // Memory only
    transactions: Array<Transaction<object>>;

    constructor(data: BlockModel) {
        this.relay = 0;
        this.transactions = [];
        Object.assign(this, data);
        // TODO check next
        // this.transactions = (data.transactions || []).map(trs => trs.getCopy());
    }
}

export class Block extends BlockModel {
    history: Array<BlockHistoryEvent> = [];

    public getCopy(): Block {
        return new Block(this);
    }

    addHistory(action: BlockLifecycle, state?: BlockHistoryState): void {
        if (!config.CORE.IS_HISTORY) {
            return;
        }

        this.history.push({ action, state });
    }
}
