import { ResponseEntity } from 'shared/model/response';
import { Filter } from 'shared/model/types';
import { DelegateModel } from 'shared/model/delegate';
import { generateDelegates } from 'api/mock/delegate';

export interface DelegateService {

    getActiveDelegates(filter: Filter): ResponseEntity<Array<DelegateModel>>;

    getInactiveDelegates(filter: Filter): ResponseEntity<Array<DelegateModel>>;

}

export class DelegateServiceImpl implements DelegateService {

    private delegates: Array<DelegateModel>; // mock for wallet

    constructor() {
        this.delegates = generateDelegates();

    }

    getActiveDelegates(filter: Filter): ResponseEntity<Array<DelegateModel>> {
        const filteredDelegates = this.delegates.slice(filter.offset, filter.limit);
        return new ResponseEntity({ data: filteredDelegates });
    }

    getInactiveDelegates(filter: Filter): ResponseEntity<Array<DelegateModel>> {
        const filteredDelegates = this.delegates.slice(filter.offset, filter.limit);
        return new ResponseEntity({ data: filteredDelegates });
    }

}

export default new DelegateServiceImpl();
