import { IDatabase } from 'pg-promise';
import dbc from 'shared/db/db';
import { GET_ALL_ACCOUNTS_BY_ADDRESS } from 'shared/db/queries/account';


class AccountRepository {
    static instance: AccountRepository = undefined;

    constructor() {
        if (AccountRepository.instance === undefined) {
            AccountRepository.instance = this;
        }
        return AccountRepository.instance;
    }

    getAccountsByAddress(address: string, tx?: IDatabase<any>) {
        return (tx || dbc).query(GET_ALL_ACCOUNTS_BY_ADDRESS, { address });
    };
}

const accountRepository = new AccountRepository();

export default accountRepository;
