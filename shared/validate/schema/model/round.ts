import {API_ACTION_TYPES} from 'shared/driver/socket/codes';
import { PAGINATION_SCHEME } from 'shared/validate/schema/common';

export const SCHEMAS_ROUND = [
    {
        id: API_ACTION_TYPES.GET_ROUND,
        type: 'object',
        properties: {
            height: {
                type: 'integer',
                minimum: 1,
            },
            ...PAGINATION_SCHEME
        },
        required: ['height', 'limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_ROUNDS,
        type: 'object',
        properties: {
            ...PAGINATION_SCHEME
        },
        required: ['limit', 'offset']
    }
];
