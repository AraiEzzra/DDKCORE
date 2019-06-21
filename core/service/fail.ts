import { BlockId } from 'shared/repository/block';

const FAIL_ROUND_BUILD_BLOCK_ID_245191 = '9795e3314bc7a550f084face0fe40e4feaa7d1fe8d45545b2b19f894076ec328';
const TRUE_ROUND_BUILD_BLOCK_ID_245191 = '369538bb46848894a66a7bc974d9c3ea76e9e7e7d5137a853a88db6f663a0fb5';

class FailService {
    public getRightLastRoundBlockId = (id: BlockId): BlockId => {
        return id === FAIL_ROUND_BUILD_BLOCK_ID_245191 ? TRUE_ROUND_BUILD_BLOCK_ID_245191 : id;
    }
}

export default new FailService();
