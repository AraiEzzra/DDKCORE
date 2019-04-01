import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_ACCOUNTS = [
    {
        id: API_ACTION_TYPES.GET_ACCOUNT,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['address']
    },
    {
        id: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address'
            }
        },
        required: ['address']
    }
];
