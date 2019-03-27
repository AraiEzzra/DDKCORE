import { TransactionType } from 'shared/model/transaction';

export const COMPONENTS_TRS_SIGNATURE = [
    {
        id: 'ASSET.SIGNATURE',
        type: 'object',
        properties: {
            publicKey: {
                type: 'string'
            }
        },
        required: ['publicKey']
    },
    {
        id: 'TRANSACTION_SIGNATURE',
        type: 'object',
        properties: {
            type: {
                type: 'number',
            },
            senderPublicKey: {
                type: 'string'
            },
            asset: {
                $ref: 'ASSET.SIGNATURE'
            }
        },
        required: ['type', 'senderPublicKey', 'asset']
    },
    {
        id: `CREATE_TRANSACTION_${TransactionType.SIGNATURE}`,
        type: 'object',
        properties: {
            data: {
                properties: {
                    trs: {
                        $ref: 'TRANSACTION_SIGNATURE'
                    },
                    secret: {
                        type: 'string',
                        minLength: 1
                    },
                    secondSecret: {
                        type: 'string',
                        minLength: 1
                    }
                },
                required: ['trs', 'secret', 'secondSecret']
            }
        },
    }
];
