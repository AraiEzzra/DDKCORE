import { TransactionType } from 'shared/model/transaction';

const ASSET_SEND = {
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
};

const SEND = {
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
};

const TRANSACTION_SEND = {
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
};

export const COMPONENTS_TRS_SEND = [].concat(ASSET_SEND, SEND, TRANSACTION_SEND);



