import { TransactionType } from 'shared/model/transaction';

export const COMPONENTS_TRS_REGISTER = [
    {
        id: 'ASSET.REGISTER',
        type: 'object',
        properties: {
            referral: {
                type: 'string'
            }
        },
        required: ['referral']
    },
    {
        id: 'TRANSACTION_REGISTER',
        type: 'object',
        properties: {
            type: {
                type: 'number',
            },
            senderPublicKey: {
                type: 'string'
            },
            asset: {
                $ref: 'ASSET.REGISTER'
            }
        },
        required: ['type', 'senderPublicKey', 'asset']
    },
    {
        id: `CREATE_TRANSACTION_${TransactionType.REGISTER}`,
        type: 'object',
        properties: {
            data: {
                properties: {
                    trs: {
                        $ref: 'TRANSACTION_REGISTER'
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
