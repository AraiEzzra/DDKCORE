import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMA_REFERRED_USERS = [
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS,
        type: 'object',
        properties: {
            address: {
                type: 'string'
            },
            filter: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number'
                    },
                    offset: {
                        type: 'number'
                    }
                },
                required: ['limit', 'offset']
            }
        },
        required: ['address', 'filter']
    },
    {
        id: API_ACTION_TYPES.GET_REFERRED_USERS_BY_LEVEL,
        type: 'object',
        properties: {
            address: {
                type: 'string'
            },
            level: {
                type: 'number'
            },
            filter: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number'
                    },
                    offset: {
                        type: 'number'
                    }
                },
                required: ['limit', 'offset']
            }
        },
        required: ['address', 'level', 'filter']
    }
];
