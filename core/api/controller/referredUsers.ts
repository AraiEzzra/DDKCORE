import AccountRepo from 'core/repository/account';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { referredUsersFactory, referredUserSerializable } from 'core/repository/referredUsers/index';
import { AirdropType } from 'ddk.registry/dist/model/common/airdrop';

type ReferredUsersMessage = Message<{
    address: string,
    level: number,
    airdropType: AirdropType
}>;

class ReferredUsersController {

    constructor() {
        this.getReferredUsers = this.getReferredUsers.bind(this);
    }

    @API(API_ACTION_TYPES.GET_REFERRED_USERS)
    public getReferredUsers(message: ReferredUsersMessage): ResponseEntity<object> {
        const { address, level, airdropType } = message.body;
        const account = AccountRepo.getByAddress(BigInt(address));

        if (!account) {
            return new ResponseEntity({ errors: ['Account not exist'] });
        }

        const referredUsers = referredUsersFactory.get(airdropType).getUsers(account, level);

        return new ResponseEntity({
            data: referredUsers.map(item => referredUserSerializable.serialize(item))
        });
    }
}

export default new ReferredUsersController();
