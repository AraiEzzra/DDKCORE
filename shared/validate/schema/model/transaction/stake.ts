import { TransactionType } from 'shared/model/transaction';

const ASSET_STAKE = {
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
};

const STAKE = {
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
};

const TRANSACTION_STAKE = {
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
};

export const COMPONENTS_TRS_STAKE = [].concat(ASSET_STAKE, STAKE, TRANSACTION_STAKE);
