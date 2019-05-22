import AccountRepo from 'core/repository/account';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import ReferredUsersRepo, { referredUserSerializable } from 'core/repository/referredUsers/index';

class ReferredUsersController {

    constructor() {
        this.getReferredUsers = this.getReferredUsers.bind(this);
    }

    @API(API_ACTION_TYPES.GET_REFERRED_USERS)
    public getReferredUsers(message: Message<{ address: string, level: number }>): ResponseEntity<object> {
        const { address, level } = message.body;
        const account = AccountRepo.getByAddress(BigInt(address));
        const referredUsers = account
            ? ReferredUsersRepo.getUsers(account, level)
            : [];

        return new ResponseEntity({
            data: {
                address,
                referredUsers: referredUsers.map(item => referredUserSerializable.serialize(item))
            }
        });
    }
}

export default new ReferredUsersController();
