import { Filter } from 'shared/model/types';
import { Reward } from 'shared/model/reward';
import ResponseEntity from 'shared/model/response';
import { Account } from 'shared/model/account';

interface ReferredUsersService {
    getReferredUsers(address: number, filter: Filter): ResponseEntity<Array<Account>>;

    getReferredUsersByLevel(address: number, level: number, filter: Filter): ResponseEntity<Array<Account>>;
}

export class ReferredUsersServiceImpl implements ReferredUsersService {

    getReferredUsers(address: number, filter: Filter): ResponseEntity<Array<Account>> {
        return undefined;
    }

    getReferredUsersByLevel(address: number, level: number, filter: Filter): ResponseEntity<Array<Account>> {
        return undefined;
    }

}

export default new ReferredUsersServiceImpl();
