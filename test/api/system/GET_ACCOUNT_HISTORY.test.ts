import { Fixture } from 'test/api/base/fixture';
import { expect } from 'chai';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';

describe('Test GET_ACCOUNT_HISTORY', () => {
    it('Positive', async () => {
        const SUCCESS = [{
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -100010000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '142804c00cc08e8a7673db85d295ca4e0cb4290aeba1f319850d030b891547aa'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -200020000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '193c9b0ecaaf30729353bd17b527189db784822d255071799b508c7c7bfafca2'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -300030000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '1b2b528f674a47ccfb95376b61358ddca088c60697ccda48c8116da0ff9cd997'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -90300030000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '2c52682e6a51a9ddfd48a679a95c9fea4e693790aec5968535a482088b6c75bf'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -90400040000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '3c8a6a5b60a5fa6b8a92178562675a6f8a107070328459b01827090e43c33b02'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -90500050000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '43bafe5056c32c7203d5618dae7a922511e4f082a7a74c6c18157ad22fda138f'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -126500050000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '5eb4507d768b810dcb60063175975cbbfabee55ef1aec24c2fec072504b1c710'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -126600060000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '693c9b0ecaaf30729353bd17b527189db784822d255071799b508c7c7bfafca2'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -126700070000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '7e7adbf7be63968e2bb9182e34824f8548229bac1a4efd15dc5e6fe29bbf05f9'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -126800080000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '9764bb44228f161213ce02287d5e29b93be52aeef6e12ae027f8e86eced937fe'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': -297800080000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': '9e805d3e4efb5e371a1f48beb8a95e6144cfd57681a47a55043daf897ba466ea'
        }, {
            'action': 'MONEY_RECEIVE',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': 4202199920000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': 'c7d80bf1bb220e62735bd388549a87c0cd93b8be30a1ae2f7291ce20d2a94b79'
        }, {
            'action': 'TRANSACTION_APPLY_UNCONFIRMED',
            'state': {
                'address': '4995063339468361088',
                'isDelegate': false,
                'publicKey': 'f4ae589b02f97e9ab5bce61cf187bcc96cfb3fdf9a11333703a682b7d47c8dc2',
                'actualBalance': 4202099910000000,
                'referrals': [],
                'votes': [],
                'stakes': [],
                arp: {
                    referrals: [],
                    stakes: [],
                },
            },
            'transactionId': 'e76dc986433289d17959f93996aaa106d453e4c0aa9d0a3ab2400231fc77aed4'
        }];

        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_ACCOUNT_HISTORY,
            body: { address: '4995063339468361088' }
        };

        const response = await socketRequest(REQUEST);

        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.deep.equal(SUCCESS);
    });
});
