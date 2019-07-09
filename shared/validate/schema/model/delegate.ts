import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { PAGINATION_SCHEME } from 'shared/validate/schema/common';

export const SCHEMAS_DELEGATES = [
    {
        id: API_ACTION_TYPES.GET_DELEGATES,
        type: 'object',
        properties: {
            ...PAGINATION_SCHEME,
            username: {
                type: 'string',
                minLength: 3,
            },
            sort: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['ASC', 'DESC', 'approval', 'publicKey'],
                    },
                },
            },
        },
        required: ['limit', 'offset'],
    },
    {
        id: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
        type: 'object',
        properties: {
            ...PAGINATION_SCHEME,
        },
        required: ['limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_MY_DELEGATES,
        type: 'object',
        properties: {
            ...PAGINATION_SCHEME,
            address: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['limit', 'offset', 'address']
    }
];
