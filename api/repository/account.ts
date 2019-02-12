import { Transaction, TransactionType } from 'shared/model/transaction';
import { getAddressByPublicKey } from 'shared/util/account';
import { Account } from 'shared/model/account';

export interface IAccountRepository {
    register(data);
}

export class AccountRepository implements IAccountRepository {

    /**
     * Create transaction for to register new Account
     * TODO
    */
    @RPC('ACCOUNT_REGISTER')
    register(data) {
        const senderId = getAddressByPublicKey(data.publicKey);
        const body = {
            trsName: TransactionType.REGISTER,
            senderPublicKey: data.publicKey,
            signature: '',
            senderId,
            assetTypes: new Account(data.account)
        };
        const trs: Transaction<any> = new Transaction();
    }
}
