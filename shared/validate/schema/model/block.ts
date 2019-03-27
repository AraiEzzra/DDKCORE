import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_BLOCKS = [
    {
        id: API_ACTION_TYPES.GET_BLOCK,
        type: 'object',
        properties: {
            id: {
                type: 'string'
            },
        },
        required: ['id']
    },
    {
        id: API_ACTION_TYPES.GET_BLOCKS,
        type: 'object',
        properties: {
            filter: {
                type: 'object'
            },
            sort: {
                type: 'array'
            },
            limit: {
                type: 'number'
            },
            offset: {
                type: 'number'
            }
        },
        required: ['filter', 'limit', 'offset']
    }
];
