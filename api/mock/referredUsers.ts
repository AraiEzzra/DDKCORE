import { getAddressByPublicKey } from 'shared/util/account';

export const referredUsersPublicKeys = [
    'bfae604a708b7b8a036ac638c6896cd8afb620f5b0bf91dcc03d1eddf370f61b',
    '251df69f603a951836667f849787f87f49eb66eb2fa5ad221e09e9c0808ce004',
    '7d800a84d498c14056e836d70dc962d092254467fb84beb59350db12cac99cf1',
    '9b2ba1c2c3bf8a663f6ccd5a72756d71a1985f942d1c9c8ae7c38c4f9b1b8a75',
];

export const generateReferredUsers = (): Array<any> => {
    return referredUsersPublicKeys.map((publicKey: string) => ({
        publicKey, address: getAddressByPublicKey(publicKey)
    }));
};
