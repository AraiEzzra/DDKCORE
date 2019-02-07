export const accountSchema =  {
    register: {
        id: 'accounts.openAccount',
        type: 'object',
        properties: {
            secret: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            }
        },
        required: ['secret']
    },
    login: {
        id: 'accounts.openAccount',
        type: 'object',
        properties: {
            secret: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            }
        },
        required: ['secret']
    },
    getBalance: {
        id: 'accounts.getBalance',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            }
        },
        required: ['address']
    },
    getPublicKey: {
        id: 'accounts.getPublickey',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            }
        },
        required: ['address']
    },
    generatePublicKey: {
        id: 'accounts.generatePublickey',
        type: 'object',
        properties: {
            secret: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            }
        },
        required: ['secret']
    },
    getDelegates: {
        id: 'accounts.getDelegates',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            }
        },
        required: ['address']
    },
    addDelegates: {
        id: 'accounts.addDelegates',
        type: 'object',
        properties: {
            secret: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            },
            secondSecret: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            }
        }
    },
    getAccount: {
        id: 'accounts.getAccount',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            },
            publicKey: {
                type: 'string',
                format: 'publicKey'
            }
        }
    },
    lockAccount: {
        id: 'accounts.lockAccount',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            },
            publicKey: {
                type: 'string',
                format: 'publicKey'
            }
        },
        required: ['address']
    },
    unlockAccount: {
        id: 'accounts.unlockAccount',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            },
            publicKey: {
                type: 'string',
                format: 'publicKey'
            }
        },
        required: ['address']
    },
    enablePendingGroupBonus: {
        id: 'accounts.enablePendingGroupBonus',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            },
            publicKey: {
                type: 'string',
                format: 'publicKey'
            }
        },
        required: ['address']
    },
    top: {
        id: 'accounts.top',
        type: 'object',
        properties: {
            limit: {
                type: 'integer',
                minimum: 0,
                maximum: 100
            },
            offset: {
                type: 'integer',
                minimum: 0
            }
        }
    },
    checkAccountExists: {
        id: 'accounts.checkAccountExists',
        type: 'object',
        properties: {
            address: {
                type: 'string',
                format: 'address',
                minLength: 1,
                maxLength: 25
            }
        },
        required: ['address']
    }
};
