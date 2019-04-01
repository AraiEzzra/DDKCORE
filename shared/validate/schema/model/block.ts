import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

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
    }
];
