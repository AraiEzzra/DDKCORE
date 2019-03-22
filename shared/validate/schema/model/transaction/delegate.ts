import { TransactionType } from 'shared/model/transaction';

const ASSET_DELEGATE = {
    id: 'ASSET.DELEGATE',
    type: 'object',
    properties: {
        username: {
            type: 'string'
        },
        url: {
            type: 'string'
        }
    },
    required: ['username']
};

const DELEGATE = {
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
};

const TRANSACTION_DELEGATE = {
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
};

export const COMPONENTS_TRS_DELEGATE = [].concat(ASSET_DELEGATE, DELEGATE, TRANSACTION_DELEGATE);
