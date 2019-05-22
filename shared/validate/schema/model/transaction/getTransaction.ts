import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { ALLOWED_TRANSACTION_TYPES_ARRAY, PAGINATION_SCHEME } from 'shared/validate/schema/common';

export const SCHEMAS_TRANSACTIONS = [
    {
        id: API_ACTION_TYPES.GET_TRANSACTION,
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'id'
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
                        type: 'integer',
                        enum: ALLOWED_TRANSACTION_TYPES_ARRAY
                    },
                    blockId: {
                        type: 'string',
                        format: 'id'
                    },
                    senderPublicKey: {
                        type: 'string',
                        format: 'publicKey'
                    }
                }
            },
            sort: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['ASC', 'DESC', 'createdAt', 'blockId', 'type'],
                    }
                }
            },
            ...PAGINATION_SCHEME
        },
        required: ['limit', 'offset']
    },
    {
        id: API_ACTION_TYPES.GET_TRANSACTIONS_BY_BLOCK_ID,
        type: 'object',
        properties: {
            blockId: {
                type: 'string',
                format: 'id'
            },
            ...PAGINATION_SCHEME
        },
        required: ['blockId', 'limit', 'offset']
    },
];
