import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMA_REFERRED_USERS = [
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS,
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
        required: ['limit', 'offset', 'address']
    },
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS_BY_LEVEL,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            },
            level: {
                type: 'integer',
                minimum: 1,
                maximum: 15
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
        required: ['address', 'level', 'limit', 'offset']
    }
];
