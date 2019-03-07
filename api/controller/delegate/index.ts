import ResponseEntity from 'shared/model/response';
import { RPC } from 'api/utils/decorators';
import { DelegateModel } from 'shared/model/delegate';
import { Filter } from 'shared/model/types';
import DelegateService from 'api/service/delegate';

export class DelegateController {

    @RPC('GET_ACTIVE_DELEGATES')
    getActiveDelegates(filter: Filter): ResponseEntity<Array<DelegateModel>> {
        return DelegateService.getActiveDelegates(filter);
    }

    @RPC('GET_INACTIVE_DELEGATES')
    getInactiveDelegates(filter: Filter): ResponseEntity<Array<DelegateModel>> {
        return DelegateService.getInactiveDelegates(filter);
    }

}

export default new DelegateController();
