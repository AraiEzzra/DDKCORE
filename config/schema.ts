const configSchema = {
    id: 'appCon',
    type: 'object',
    properties: {
        IS_SECURE: {
            type: 'boolean'
        },
        PUBLIC_HOST: {
            type: 'string'
        },
        NODE_ENV_IN: {
            type: 'string'
        },
        DB: {
            type: 'object',
            properties: {
                HOST: {
                    type: 'string',
                },
                PORT: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 65535
                },
                DATABASE: {
                    type: 'string'
                },
                USER: {
                    type: 'string'
                },
                POOL_SIZE: {
                    type: 'integer'
                },
                POOL_IDLE_TIMEOUT: {
                    type: 'integer'
                },
                REAP_INTERVAL_MILLIS: {
                    type: 'integer'
                },
                LOG_EVENTS: {
                    type: 'array'
                }
            },
            required: [
                'HOST',
                'PORT',
                'DATABASE',
                'USER',
                'POOL_SIZE',
                'POOL_IDLE_TIMEOUT',
                'REAP_INTERVAL_MILLIS',
                'LOG_EVENTS'
            ]
        },
        API: {
            type: 'object',
            properties: {
                SOCKET: {
                    type: 'object',
                    properties: {
                        PORT: {
                            type: 'integer'
                        },
                    },
                    required: ['PORT']
                },
            },
            required: ['SOCKET']
        },
        CORE: {
            type: 'object',
            properties: {
                SOCKET: {
                    type: 'object',
                    properties: {
                        PORT: {
                            type: 'integer'
                        },
                    },
                    required: ['PORT']
                },
                FORGING: {
                    type: 'object',
                    properties: {
                        SECRET: {
                            type: 'string'
                        },
                    },
                    required: ['SECRET']
                },
                PEERS: {
                    type: 'object',
                    properties: {
                        TRUSTED: {
                            type: 'array'
                        },
                        BLACKLIST: {
                            type: 'array'
                        },
                    },
                    required: ['TRUSTED', 'BLACKLIST']
                },
            },
            required: ['SOCKET', 'FORGING', 'PEERS']
        },
    },
    required: ['DB', 'API', 'CORE', 'GENESIS_BLOCK', 'CONSTANTS']
};

export default configSchema;
