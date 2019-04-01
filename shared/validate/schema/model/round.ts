import {API_ACTION_TYPES} from 'shared/driver/socket/codes';

export const SCHEMAS_ROUND = [
    {
        id: API_ACTION_TYPES.GET_ROUND,
        type: 'object',
        properties: {
            height: {
                type: 'integer',
                minimum: 1,
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
        required: ['height', 'limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_ROUNDS,
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
    }
];
