import { TransactionType } from 'shared/model/transaction';

export const COMPONENTS_TRS_DELEGATE = [
    {
        id: 'ASSET.DELEGATE',
        type: 'object',
        properties: {
            username: {
                type: 'string',
                minLength: 1,
                maxLength: 20
            }
        },
        required: ['username']
    },
    {
        id: 'TRANSACTION_DELEGATE',
        type: 'object',
        properties: {
            type: {
                type: 'number',
            },
            senderPublicKey: {
                type: 'string'
            },
            asset: {
                $ref: 'ASSET.DELEGATE'
            }
        },
        required: ['type', 'senderPublicKey', 'asset']
    },
    {
        id: `CREATE_TRANSACTION_${TransactionType.DELEGATE}`,
        type: 'object',
        properties: {
            data: {
                properties: {
                    trs: {
                        $ref: 'TRANSACTION_DELEGATE'
                    },
                    secret: {
                        type: 'string',
                        minLength: 1
                    }
                },
                required: ['trs', 'secret']
            }
        },
    }
];
