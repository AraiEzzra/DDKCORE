
let env = process.env;

module.exports = {
    port: parseInt(env.PORT, 10) || 7000,
    address: env.DEFAULT_ADDRESS || '0.0.0.0',
    version: '0.9.9a',
    minVersion: '>=0.9.0',
    fileLogLevel: 'info',
    logFileName: 'logs/ddk.log',
    consoleLogLevel: 'none',
    trustProxy: false,
    topAccounts: false,
    cacheEnabled: true,
    db: {
        host: env.DEFAULT_DB_HOST || '0.0.0.0',
        port: parseInt(env.DEFAULT_DB_PORT, 10) || 5432,
        database: env.DEFAULT_DB_NAME || 'DDK_test',
        password: env.DEFAULT_DB_PASSWORD || 'password',
        user: env.DEFAULT_DB_USER || '',
        poolSize: 95,
        poolIdleTimeout: 30000,
        reapIntervalMillis: 1000,
        logEvents: [
            'error'
        ]
    },
    redis: {
        host: env.DEFAULT_REDIS_HOST || '0.0.0.0',
        port: parseInt(env.DEFAULT_REDIS_PORT, 10) || 6380,
        db: 0
    },
    api: {
        enabled: true,
        access: {
            public: true,
            whiteList: [
                '127.0.0.1',
                '192.168.9.91'
            ]
        },
        options: {
            limits: {
                max: 0,
                delayMs: 0,
                delayAfter: 0,
                windowMs: 60000
            }
        }
    },
    peers: {
        enabled: true,
        list: (env.DEFAULT_PEERS || '').split(',').map(peer => peer.split(':')).map(([ip, port]) => ({ ip, port })),
        access: {
            blackList: (env.DEFAULT_PEERS_BLACKLIST || '').split(','),
        },
        options: {
            limits: {
                max: 0,
                delayMs: 0,
                delayAfter: 0,
                windowMs: 60000
            },
            timeout: 5000
        }
    },
    broadcasts: {
        broadcastInterval: 5000,
        broadcastLimit: 20,
        parallelLimit: 20,
        releaseLimit: 25,
        relayLimit: 2
    },
    transactions: {
        maxTxsPerQueue: 1000
    },
    forging: {
        force: true,
        minBroadhashConsensus: parseInt(env.DEFAULT_MIN_CONSENSUS, 10) || 0,
        secret: env.DEFAULT_FORGE_SECRET || [],
        access: {
            whiteList: [
                '127.0.0.1',
                '192.168.9.91'
            ]
        }
    },
    loading: {
        verifyOnLoading: false,
        loadPerIteration: 5000
    },
    ssl: {
        enabled: false,
        options: {
            port: 443,
            address: env.DEFAULT_ADDRESS || '0.0.0.0',
            key: env.DEFAULT_SSL_KEY,
            cert: env.DEFAULT_SSL_CERT
        }
    },
    dapp: {
        masterrequired: true,
        autoexec: [],
        masterpassword: env.DAPP_MASTERPASSWORD
    },
    initialPrimined: {
        total: 360000000000000
    },
    ddkSupply: {
        totalSupply: 4500000000000000
    },
    session: {
        secret: env.SESSION_SECRET
    },
    app: {},
    sender: {},
    nethash: env.NETHASH,
    elasticsearchHost: env.DEFAULT_ELASTICSEARCH_HOST + ':9200'|| '0.0.0.0:9200',
    swaggerDomain: env.DEFAULT_ADDRESS,
    jwt: {
        secret: env.JWT_SECRET,
        tokenLife: 300
    },
    mailFrom: env.MAIL_FROM,
    hashSecret: env.HASH_SECRET,
    users: [
        {
            keys: env.DSTAKEREWARD
        },
        {
            keys: env.DCONTRIBUTOR
        },
        {
            keys: env.DADVISOR
        },
        {
            keys: env.DTEAM
        },
        {
            keys: env.DFOUNDER
        },
        {
            keys: env.DPENDINGGB
        },
        {
            keys: env.DAIRDROP
        },
        {
            keys: env.DRESERVEDEX
        },
        {
            keys: env.DPREORDERDNC
        }
    ]
};
