export const SCHEMA_CREATE_TRANSACRION = {
    id: 'transactions.createTransaction',
    type: 'object',
    properties: {
        id: {
            type: 'string'
        },
        type: {
            type: 'number',
        },
        senderPublicKey: {
            type: 'string'
        },
        senderAddress: {
            type: 'number'
        },
        signature: { // TODO replace on "secret"
            type: 'string'
        },
        secondSignature: {
            type: 'string'
        },
        createdAt: {
            type: 'number'
        },
        salt: {
            type: 'string'
        },
        asset: {
            type: 'object'
        }
    },
    required: ['type']
};

