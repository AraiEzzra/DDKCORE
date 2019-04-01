import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_DELEGATES = [
    {
        id: API_ACTION_TYPES.GET_DELEGATES,
        type: 'object',
        properties: {
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
        required: ['limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
        type: 'object',
        properties: {
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
        required: ['limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_MY_DELEGATES,
        type: 'object',
        properties: {
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100
            },
            offset: {
                type: 'integer',
                minimum: 0,
            },
            address: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['limit', 'offset', 'address']
    }
];
