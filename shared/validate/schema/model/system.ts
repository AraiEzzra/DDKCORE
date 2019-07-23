import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { PAGINATION_SCHEME } from 'shared/validate/schema/common';

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
    {
        id: API_ACTION_TYPES.GET_ALL_UNCONFIRMED_TRANSACTIONS,
        type: 'object',
        properties: {
            ...PAGINATION_SCHEME,
            offset: {
                ...PAGINATION_SCHEME.offset,
                maximum: 100000,
            },
        },
        required: ['limit', 'offset']
    },

];
