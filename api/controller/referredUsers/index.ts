import { RPC } from 'api/utils/decorators';
import ResponseEntity from 'shared/model/response';
import { Reward } from 'shared/model/reward';
import { getReferredListByLevelProps, getReferredListProps } from 'api/controller/referredUsers/types';
import ReferredUsersService from 'api/service/referredUsers';
import { Account } from 'shared/model/account';

export class ReferredUsersController {

    @RPC('GET_REFERRED_USERS')
    getReferredUsers(data: getReferredListProps): ResponseEntity<Array<Account>> {
        return ReferredUsersService.getReferredUsers(data.address, data.filter);
    }

    @RPC('GET_REFERRED_USERS_BY_LEVEL')
    getReferredUsersByLevel(data: getReferredListByLevelProps): ResponseEntity<Array<Account>> {
        return ReferredUsersService.getReferredUsersByLevel(data.address, data.level, data.filter);
    }
}

export default new ReferredUsersController();
