import Response from 'shared/model/response';
import { Block } from 'shared/model/block';

export interface IDelegateService {
    fork(block: Block, cause: string): Promise<Response<void>>;

    validateBlockSlotAgainstPreviousRound(block: Block): Promise<Response<void>>;

    validateBlockSlot(block: Block, delegatesPublicKeys: string[]): Promise<Response<void>>;
}
