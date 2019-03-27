import { TransactionType } from 'shared/model/transaction';

export const COMPONENTS_TRS_SEND = [
    {
        id: 'ASSET.SEND',
        type: 'object',
        properties: {
            amount: {
                type: 'number',
            },
            recipientAddress: {
                type: 'string'
            }
        },
        required: ['amount', 'recipientAddress']
    },
    {
        id: 'TRANSACTION_SEND',
        type: 'object',
        properties: {
            type: {
                type: 'number',
            },
            senderPublicKey: {
                type: 'string'
            },
            asset: {
                $ref: 'ASSET.SEND'
            }
        },
        required: ['type', 'senderPublicKey', 'asset']
    },
    {
        id: `CREATE_TRANSACTION_${TransactionType.SEND}`,
        type: 'object',
        properties: {
            data: {
                properties: {
                    trs: {
                        $ref: `TRANSACTION_SEND`
                    },
                    secret: {
                        type: 'string',
                        minLength: 1
                    }
                },
                required: ['trs', 'secret']
            }
        }
    }
];



