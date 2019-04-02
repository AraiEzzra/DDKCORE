import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_REWARD = [
    {
        id: API_ACTION_TYPES.GET_REWARD_HISTORY,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100
            },
            offset: {
                type: 'integer',
                minimum: 0,
            }
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
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100
            },
            offset: {
                type: 'integer',
                minimum: 0,
            }
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
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100
            },
            offset: {
                type: 'integer',
                minimum: 0,
            }
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
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100
            },
            offset: {
                type: 'integer',
                minimum: 0,
            }
        },
        required: ['address', 'limit', 'offset']
    }
];
