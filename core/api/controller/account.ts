import AccountRepo from 'core/repository/account';
import { API } from 'core/api/util/decorators';
import { Message } from 'shared/model/message';
import { ResponseEntity } from 'shared/model/response';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { isAccountReferrer } from 'core/util/referral';

class AccountController {

    constructor() {
        this.getAccount = this.getAccount.bind(this);
        this.getAccountBalance = this.getAccountBalance.bind(this);
    }

    @API(API_ACTION_TYPES.GET_ACCOUNT)
    public getAccount(message: Message<{ address: string }>): ResponseEntity<object> {
        const account = AccountRepo.getByAddress(BigInt(message.body.address));
        return new ResponseEntity({
            data: account ? AccountRepo.serialize(account) : null
        });
    }

    @API(API_ACTION_TYPES.GET_ACCOUNT_BALANCE)
    public getAccountBalance(message: Message<{ address: string }>): ResponseEntity<number> {
        const account = AccountRepo.getByAddress(BigInt(message.body.address));
        return new ResponseEntity({
            data: account ? account.actualBalance : 0
        });
    }

    @API(API_ACTION_TYPES.IS_ACCOUNT_REFERRER)
    public isReferrer(message: Message<{ address: string }>): ResponseEntity<boolean> {
        const account = AccountRepo.getByAddress(BigInt(message.body.address));
        if (!account) {
            return new ResponseEntity({
                errors: ['Account not found']
            });
        }

        return new ResponseEntity({
            data: isAccountReferrer(account),
        });
    }
}

export default new AccountController();
