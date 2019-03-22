import AccountRepo from 'core/repository/account';
import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

class AccountController {

    constructor() {
        this.getAccount = this.getAccount.bind(this);
        this.getAccountBalance = this.getAccountBalance.bind(this);
    }

    @API(API_ACTION_TYPES.GET_ACCOUNT)
    public getAccount(message: Message2<{ address: string }>): ResponseEntity<object> {
        return new ResponseEntity({
            data: AccountRepo.serialize(AccountRepo.getByAddress(BigInt(message.body.address)))
        });
    }

    @API(API_ACTION_TYPES.GET_ACCOUNT_BALANCE)
    public getAccountBalance(message: Message2<{ address: string }>): ResponseEntity<number> {
        return new ResponseEntity({
            data: AccountRepo.getByAddress(BigInt(message.body.address)).actualBalance
        });
    }

}

export default new AccountController();
