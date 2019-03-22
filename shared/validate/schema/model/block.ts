import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

const GET_BLOCK = {
    id: API_ACTION_TYPES.GET_BLOCK,
    type: 'object',
    properties: {
        id: {
            type: 'string'
        },
    },
    required: ['id']
};

const GET_BLOCKS = {
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
};

export const SCHEMAS_GET_BLOCK = [].concat(
    GET_BLOCK,
    GET_BLOCKS
);
