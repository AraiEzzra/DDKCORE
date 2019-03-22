import { TransactionType } from 'shared/model/transaction';

const ASSET_VOTE = {
    id: 'ASSET.VOTE',
    type: 'object',
    properties: {
        votes: {
            type: 'array'
        },
        reward: {
            type: 'number',
            minimum: 0
        },
        unstake: {
            type: 'number',
            minimum: 0
        },

    },
    required: ['votes']
};

const VOTE = {
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
};

const TRANSACTION_VOTE = {
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
                    minLength: 1
                }
            },
            required: ['trs', 'secret']
        }
    },
};

export const COMPONENTS_TRS_VOTE = [].concat(ASSET_VOTE, VOTE, TRANSACTION_VOTE);
