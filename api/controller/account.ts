import AccountService from 'api/service/account';
import { AccountModel, Address, PublicKey } from 'shared/model/account';
import ResponseEntity from 'shared/model/response';

export class AccountController {

    // @RPC("GET_ACCOUNT_BY_ADDRESS")
    getAccountByAddress(address: Address): ResponseEntity<AccountModel> {
        return AccountService.getAccountByAddress(address);
    };

    // @RPC("GET_ACCOUNT_BY_PUBLIC_KEY")
    getAccountByPublicKey(publicKey: PublicKey): ResponseEntity<AccountModel> {
        return AccountService.getAccountByPublicKey(publicKey);
    };

}

export default new AccountController();
