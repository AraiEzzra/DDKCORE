import { TransactionType } from 'shared/model/transaction';

export const COMPONENTS_TRS_VOTE = [
    {
        id: 'ASSET.VOTE',
        type: 'object',
        properties: {
            votes: {
                type: 'array'
            },
            type: {
                type: 'string',
                minLength: 1,
                maxLength: 1
            }
        },
        required: ['votes', 'type']
    },
    {
        id: 'TRANSACTION_VOTE',
        type: 'object',
        properties: {
            type: {
                type: 'number',
            },
            senderPublicKey: {
                type: 'string'
            },
            asset: {
                $ref: 'ASSET.VOTE'
            }
        },
        required: ['type', 'senderPublicKey', 'asset']
    },
    {
        id: `CREATE_TRANSACTION_${TransactionType.VOTE}`,
        type: 'object',
        properties: {
            data: {
                properties: {
                    trs: {
                        $ref: 'TRANSACTION_VOTE'
                    },
                    secret: {
                        type: 'string',
                        minLength: 1,
                    },
                    secondSecret: {
                        type: 'string',
                        minLength: 1,
                    }
                },
                required: ['trs', 'secret']
            }
        },
    }
];
