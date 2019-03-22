import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

const GET_TRANSACTION = {
    id: API_ACTION_TYPES.GET_TRANSACTION,
    type: 'object',
    properties: {
        address: {
            type: 'string'
        }
    },
    required: ['id']
};

const GET_TRANSACTIONS = {
    id: API_ACTION_TYPES.GET_TRANSACTIONS,
    type: 'object',
    properties: {
        filter: {
            type: 'object',
            properties: {
                type: {
                    type: 'number'
                },
                block_id: {
                    type: 'string'
                },
                sender_public_key: {
                    type: 'string'
                }
            }
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
    required: ['filter']
};

const GET_TRANSACTIONS_BY_BLOCK_ID = {
    id: API_ACTION_TYPES.GET_TRANSACTIONS_BY_BLOCK_ID,
    type: 'object',
    properties: {
        blockId: {
            type: 'string'
        },
        limit: {
            type: 'number'
        },
        offset: {
            type: 'number'
        }
    },
    required: ['blockId']
};

export const SCHEMAS_GET_TRS = [].concat(
    GET_TRANSACTION,
    GET_TRANSACTIONS,
    GET_TRANSACTIONS_BY_BLOCK_ID
);
