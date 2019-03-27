import { TransactionType } from 'shared/model/transaction';

export const COMPONENTS_TRS_STAKE = [
    {
        id: 'ASSET.STAKE',
        type: 'object',
        properties: {
            amount: {
                type: 'number',
                minimum: 0
            },
            startVoteCount: {
                type: 'number',
                minimum: 0
            },
            startTime: {
                type: 'number'
            }
        },
        required: ['amount', 'startVoteCount']
    },
    {
        id: 'TRANSACTION_STAKE',
        type: 'object',
        properties: {
            type: {
                type: 'number',
            },
            senderPublicKey: {
                type: 'string'
            },
            asset: {
                $ref: 'ASSET.STAKE'
            }
        },
        required: ['type', 'senderPublicKey', 'asset']
    },
    {
        id: `CREATE_TRANSACTION_${TransactionType.STAKE}`,
        type: 'object',
        properties: {
            data: {
                properties: {
                    trs: {
                        $ref: 'TRANSACTION_STAKE'
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
