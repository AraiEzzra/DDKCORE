import { BlockId } from 'shared/repository/block';
import config from 'shared/config';
import { Transaction } from 'shared/model/transaction';
import BlockStorageService from 'core/service/blockStorage';

const FAIL_ROUND_BUILD_BLOCK_ID_245191 = '9795e3314bc7a550f084face0fe40e4feaa7d1fe8d45545b2b19f894076ec328';
const TRUE_ROUND_BUILD_BLOCK_ID_245191 = '369538bb46848894a66a7bc974d9c3ea76e9e7e7d5137a853a88db6f663a0fb5';

const FIRST_SLOT_BROKEN_ROUND = 10939114;
const LAST_SLOT_BROKEN_ROUND = 10939124;

const BAD_BLOCK_ID_310567 = 'b21408ea3aa1303ea3a3d63f640b2942208fb382bb4d6ce878a126dd5c054590';

class FailService {
    public getRightLastRoundBlockId = (id: BlockId): BlockId => {
        return id === FAIL_ROUND_BUILD_BLOCK_ID_245191 ? TRUE_ROUND_BUILD_BLOCK_ID_245191 : id;
    }

    public isValidateBlockSlot = (slotNumber: number): boolean => {
        if (slotNumber >= FIRST_SLOT_BROKEN_ROUND && slotNumber <= LAST_SLOT_BROKEN_ROUND) {
            return false;
        }
        return true;
    }

    public isVerifyBlock = (id: BlockId): boolean => {
        return id !== BAD_BLOCK_ID_310567;
    }

    public isVerifyTransactionInThePast(trs: Transaction<any>): boolean {
        return trs.blockId && BlockStorageService.getHeaders(trs.blockId)
            && BlockStorageService.getHeaders(trs.blockId).height >
            config.CONSTANTS.START_FEATURE_BLOCK.FIX_TRANSACTION_IN_THE_PAST_BLOCK_HEIGHT;
    }
}

export default new FailService();
