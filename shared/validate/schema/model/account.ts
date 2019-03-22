import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

const GET_ACCOUNT = {
    id: API_ACTION_TYPES.GET_ACCOUNT,
    type: 'object',
    properties: {
        address: {
            type: 'string'
        }
    },
    required: ['address']
};

const GET_ACCOUNT_BALANCE = {
    id: API_ACTION_TYPES.GET_ACCOUNT_BALANCE,
    type: 'object',
    properties: {
        address: {
            type: 'string'
        }
    },
    required: ['address']
};

export const SCHEMAS_GET_ACCOUNT = [].concat(
    GET_ACCOUNT,
    GET_ACCOUNT_BALANCE
);
