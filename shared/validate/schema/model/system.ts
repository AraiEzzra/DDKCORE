import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_SYSTEM = [
    {
        id: API_ACTION_TYPES.GET_ACCOUNT_HISTORY,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
            }
        },
        required: ['address'],
    },
    {
        id: API_ACTION_TYPES.GET_TRANSACTION_HISTORY,
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'id'
            },
        },
        required: ['id']
    },
    {
        id: API_ACTION_TYPES.GET_BLOCK_HISTORY,
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'id'
            },
        },
        required: ['id']
    },
];
