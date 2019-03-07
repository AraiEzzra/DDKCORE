import { Account, AccountModel } from 'shared/model/account';
import { getAddressByPublicKey } from 'shared/util/account';

const publicKeys = [
    '137b9f0f839ab3ecd2146bfecd64d31e127d79431211e352bedfeba5fd61a57a',
    '6e044df2a479ef728bde085ada32cbc4c2b4b078e4f8c0456f50994586048478',
    'bdb6f3ee251096c395016ba25edf420c4a381dcfc0005241f924f46688541e21',
    'bfae604a708b7b8a036ac638c6896cd8afb620f5b0bf91dcc03d1eddf370f61b',
    '251df69f603a951836667f849787f87f49eb66eb2fa5ad221e09e9c0808ce004',
    '7d800a84d498c14056e836d70dc962d092254467fb84beb59350db12cac99cf1',
    '9b2ba1c2c3bf8a663f6ccd5a72756d71a1985f942d1c9c8ae7c38c4f9b1b8a75',
];

export const generateAccounts = (): Array<AccountModel> => {
    return publicKeys.map((publicKey: any) => generateAccount(publicKey));
};

export const generateAccount = (publicKey: string): AccountModel => {
    const address = getAddressByPublicKey(publicKey);
    return new AccountModel({ address: address, publicKey: publicKey });
};

export const generateAccountInstance = (publicKey: string): Account => {
    const address = getAddressByPublicKey(publicKey);
    return new Account({ address: address, publicKey: publicKey });
};
