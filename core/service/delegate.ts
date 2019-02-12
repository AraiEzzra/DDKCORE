import Response from 'shared/model/response';
import { Block } from 'shared/model/block';

export interface IDelegateService {
    fork(block: Block, cause: string): Promise<Response<void>>;

    validateBlockSlotAgainstPreviousRound(block: Block): Promise<Response<void>>;

    validateBlockSlot(block: Block, delegatesPublicKeys: string[]): Promise<Response<void>>;
}

export class DelegateService implements IDelegateService {
    public async fork(block: Block, cause: string): Promise<Response<void>> {
        return new Response({});
    }

    public async validateBlockSlot(block: Block, delegatesPublicKeys?: string[]): Promise<Response<void>> {
        return new Response({});
    }

    public async validateBlockSlotAgainstPreviousRound(block: Block): Promise<Response<void>> {
        return new Response({});
    }
}
