import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

const GET_REFERRED_USERS = {
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
};

const GET_REFERRED_USERS_BY_LEVEL = {
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
};

export const SCHEMAS_GET_REFERRED_USER = [].concat(
    GET_REFERRED_USERS,
    GET_REFERRED_USERS_BY_LEVEL
);
