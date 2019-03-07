import { DelegateModel } from 'shared/model/delegate';
import { generateAccountInstance } from 'api/mock/account';
import { getRandomNumber } from 'api/mock/common';

const delegatePublicKeys = [
    '6e044df2a479ef728bde085ada32cbc4c2b4b078e4f8c0456f50994586048478',
    'bfae604a708b7b8a036ac638c6896cd8afb620f5b0bf91dcc03d1eddf370f61b',
    '7d800a84d498c14056e836d70dc962d092254467fb84beb59350db12cac99cf1',
    '4333a25de293e2ed8f832e3d98852cbc6bc6c04aa75a780222f8f78e2d0398fc',
    '085b471f490abf61dbf40df5316555378a2fa3f807242d3b7de17cb27598709f',
    'e60e9c28c8efdda14e5ba744e676a301d185721df1bbb76df5a4730c54d4a5eb',
    'cb6c1c40f09e0e1dc52cf0bb0efb7785b80b89c0574f2fcae4e8a55ea35f9217',
    '78143208a9a5fe8a01c66812842c4e3abd866f94b8755e61d18f4d7e735a62e8',
    '0a5296734079fe6f6e5a005ecc2e26de2be9df1e6a337bddcb90d021bd794b2b',
    '5df918c7b3859c609a4da9242fdf666e8e35cf63cf6d8cd175fcb9258275cc5e',
    '70aa5b428f0f88cbfb68abd8f06c168c58aad4d4c1ad41fc17e045f441e1aa22',
    '16c697f569267231dffc1d6d1e622c4dea13f31a0422d8d2175dcf9b5260d451',
];

export const generateDelegates = (): Array<DelegateModel> => {
    return delegatePublicKeys.map((publicKey: string, index: number) => generateDelegate(index, publicKey));
};

export const generateDelegate = (index: number, publicKey: string): DelegateModel => {
    const delegatesAccount = generateAccountInstance(publicKey);
    return new DelegateModel({
        username: 'Test' + index.toString(),
        url: '/delegateUrl' + index.toString(),
        missedBlocks: getRandomNumber(1, 6),
        forgedBlocks: getRandomNumber(1, 100),
        account: delegatesAccount,
        votes: getRandomNumber(1, 50),
    });
};
