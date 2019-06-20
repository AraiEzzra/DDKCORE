import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { PAGINATION_SCHEME } from 'shared/validate/schema/common';

export const SCHEMAS_BLOCKS = [
    {
        id: API_ACTION_TYPES.GET_BLOCK,
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
        id: API_ACTION_TYPES.GET_BLOCK_BY_HEIGHT,
        type: 'object',
        properties: {
            height: {
                type: 'integer',
                minimum: 1
            },
        },
        required: ['height']
    },
    {
        id: API_ACTION_TYPES.GET_LAST_BLOCK,
        type: 'object',
    },
    {
        id: API_ACTION_TYPES.GET_BLOCKS,
        type: 'object',
        properties: {
            filter: {
                type: 'object',
                properties: {
                    height: {
                        type: 'integer',
                        minimum: 1
                    },
                }
            },
            sort: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['ASC', 'DESC', 'createdAt', 'height'],
                    }
                }
            },
            ...PAGINATION_SCHEME
        },
        required: ['limit', 'offset']
    }
];
