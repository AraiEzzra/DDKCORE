import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

const GET_DELEGATES = {
    id: API_ACTION_TYPES.GET_DELEGATES,
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
};

const GET_ACTIVE_DELEGATES = {
    id: API_ACTION_TYPES.GET_ACTIVE_DELEGATES,
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
};


const GET_MY_DELEGATES = {
    id: API_ACTION_TYPES.GET_MY_DELEGATES,
    type: 'object',
    properties: {
        limit: {
            type: 'number'
        },
        offset: {
            type: 'number'
        },
        address: {
            type: 'string'
        }
    },
    required: ['limit', 'offset', 'address']
};

export const SCHEMAS_GET_DELEGATE = [].concat(
    GET_DELEGATES,
    GET_ACTIVE_DELEGATES,
    GET_MY_DELEGATES
);
