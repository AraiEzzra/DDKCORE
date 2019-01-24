import { Account } from 'shared/model/account';

export class AuthorizedAccount extends Account {
    token: string;

    constructor(data: any, token: string) {
        super(data);
        this.token = token;
    }
}
