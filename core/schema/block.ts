export default {
    id: 'Block',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'hex',
            minLength: 1,
            maxLength: 64
        },
        height: {
            type: 'integer'
        },
        signature: {
            type: 'string',
            format: 'signature'
        },
        generatorPublicKey: {
            type: 'string',
            format: 'publicKey'
        },
        transactionCount: {
            type: 'integer'
        },
        payloadHash: {
            type: 'string',
            format: 'hex'
        },
        previousBlockId: {
            type: 'string',
            format: 'hex',
            minLength: 1,
            maxLength: 64
        },
        createdAt: {
            type: 'integer'
        },
        amount: {
            type: 'integer',
            minimum: 0
        },
        fee: {
            type: 'integer',
            minimum: 0
        },
        transactions: {
            type: 'array',
            uniqueItems: true
        },
        version: {
            type: 'integer',
            minimum: 0
        }
    },
    required: [
        'signature',
        'generatorPublicKey',
        'transactionCount', '' +
        'payloadHash',
        'createdAt',
        'amount',
        'fee',
        'version'
    ]
};
