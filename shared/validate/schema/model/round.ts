import {API_ACTION_TYPES} from 'shared/driver/socket/codes';

export const SCHEMAS_ROUND = [
    {
        id: API_ACTION_TYPES.GET_ROUND,
        type: 'object',
        properties: {
            height: {
                type: 'number'
            }
        },
        required: ['height']
    },
    {
        id: API_ACTION_TYPES.GET_ROUNDS,
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
];
