import { Account } from 'shared/model/account';
import * as crypto from 'crypto';
import {getAddressByPublicKey} from 'shared/util/account';

let accountIdSequence = 1;
export const getNewAccount = (): Account => {
    accountIdSequence++;
    const publicKey = crypto.createHash('sha256').update(Buffer.from('user' + accountIdSequence)).digest('hex');
    return new Account({
        address: getAddressByPublicKey(publicKey),
        publicKey
    });
};
