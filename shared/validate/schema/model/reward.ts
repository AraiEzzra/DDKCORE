import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { PAGINATION_SCHEME } from 'shared/validate/schema/common';

export const SCHEMAS_REWARD = [
    {
        id: API_ACTION_TYPES.GET_REWARD_HISTORY,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            ...PAGINATION_SCHEME
        },
        required: ['address', 'limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS_REWARDS,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            ...PAGINATION_SCHEME
        },
        required: ['address', 'limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_STAKE_REWARDS,
        type: 'object',
        properties: {
            senderPublicKey: {
                type: 'string',
                format: 'publicKey'
            },
            ...PAGINATION_SCHEME
        },
        required: ['senderPublicKey', 'limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_AIRDROP_REWARDS,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            ...PAGINATION_SCHEME
        },
        required: ['address', 'limit', 'offset']
    }
];
