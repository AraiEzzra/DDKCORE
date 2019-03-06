import Response from 'shared/model/response';
import { Block } from 'shared/model/block';

export interface IDelegateService {
    fork(block: Block, cause: string): Response<void>;

    validateBlockSlotAgainstPreviousRound(block: Block): Response<void>;

    validateBlockSlot(block: Block, delegatesPublicKeys: string[]): Response<void>;

    loadDelegates(): Response<void>;

    forge(): Response<void>;
}

export class DelegateService implements IDelegateService {
    public fork(block: Block, cause: string): Response<void> {
        return new Response({});
    }

    public forge(): Response<void> {
        return new Response({});
    }

    public validateBlockSlot(block: Block, delegatesPublicKeys?: string[]): Response<void> {
        return new Response({});
    }

    public validateBlockSlotAgainstPreviousRound(block: Block): Response<void> {
        return new Response({});
    }

    public loadDelegates(): Response<void> {
        return new Response({});
    }
}
