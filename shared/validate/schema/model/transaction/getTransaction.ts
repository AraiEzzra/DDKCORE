import { API_ACTION_TYPES } from 'shared/driver/socket/codes';

export const SCHEMAS_TRANSACTIONS = [
    {
        id: API_ACTION_TYPES.GET_TRANSACTION,
        type: 'object',
        properties: {
            address: {
                type: 'string'
            }
        },
        required: ['id']
    },
    {
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
    },
    {
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
    }
];
