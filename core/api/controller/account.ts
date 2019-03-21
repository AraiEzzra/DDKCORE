import AccountRepo from 'core/repository/account';
import { API } from 'core/api/util/decorators';
import { Message2 } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { GET_ACCOUNT, GET_ACCOUNT_BALANCE } from 'shared/driver/socket/codes';

class AccountController {

    constructor() {
        this.getAccount = this.getAccount.bind(this);
        this.getAccountBalance = this.getAccountBalance.bind(this);
    }

    @API(GET_ACCOUNT)
    public getAccount(message: Message2<{ address: string }>): ResponseEntity<object> {
        return new ResponseEntity({
            data: AccountRepo.serialize(AccountRepo.getByAddress(BigInt(message.body.address)))
        });
    }

    @API(GET_ACCOUNT_BALANCE)
    public getAccountBalance(message: Message2<{ address: string }>): ResponseEntity<number> {
        return new ResponseEntity({
            data: AccountRepo.getByAddress(BigInt(message.body.address)).actualBalance
        });
    }

}

export default new AccountController();
