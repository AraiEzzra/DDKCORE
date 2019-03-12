import { ResponseEntity } from 'shared/model/response';
import { Block } from 'shared/model/block';

export interface IDelegateService {
    fork(block: Block, cause: string): ResponseEntity<void>;

    validateBlockSlotAgainstPreviousRound(block: Block): ResponseEntity<void>;

    validateBlockSlot(block: Block, delegatesPublicKeys: string[]): ResponseEntity<void>;

    loadDelegates(): ResponseEntity<void>;

    forge(): ResponseEntity<void>;
}

export class DelegateService implements IDelegateService {
    public fork(block: Block, cause: string): ResponseEntity<void> {
        return new ResponseEntity<void>({});
    }

    public forge(): ResponseEntity<void> {
        return new ResponseEntity<void>({});
    }

    public validateBlockSlot(block: Block, delegatesPublicKeys?: string[]): ResponseEntity<void> {
        return new ResponseEntity<void>({});
    }

    public validateBlockSlotAgainstPreviousRound(block: Block): ResponseEntity<void> {
        return new ResponseEntity<void>({});
    }

    public loadDelegates(): ResponseEntity<void> {
        return new ResponseEntity<void>({});
    }
}
