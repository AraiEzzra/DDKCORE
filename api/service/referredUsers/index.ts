import { Filter } from 'shared/model/types';
import { ResponseEntity } from 'shared/model/response';
import { AccountModel, Address } from 'shared/model/account';
import { generateReferredUsers } from 'api/mock/referredUsers';

interface ReferredUsersService {
    getReferredUsers(address: Address, filter: Filter): ResponseEntity<Array<AccountModel>>;

    getReferredUsersByLevel(address: Address, level: number, filter: Filter): ResponseEntity<Array<AccountModel>>;
}

export class ReferredUsersServiceImpl implements ReferredUsersService {

    getReferredUsers(address: Address, filter: Filter): ResponseEntity<Array<AccountModel>> {
        return new ResponseEntity({data: generateReferredUsers()});
    }

    getReferredUsersByLevel(address: Address, level: number, filter: Filter): ResponseEntity<Array<AccountModel>> {
        return new ResponseEntity({data: generateReferredUsers()});
    }

}

export default new ReferredUsersServiceImpl();
