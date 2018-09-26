
let env = process.env;

module.exports = {
    port: parseInt(env.PORT, 10) || 7000,
    address: env.TESTNET_ADDRESS || '0.0.0.0',
    version: '0.9.9a',
    minVersion: '>=0.9.0',
    fileLogLevel: 'info',
    logFileName: 'logs/ddk.log',
    consoleLogLevel: 'none',
    trustProxy: false,
    topAccounts: false,
    cacheEnabled: true,
    db: {
        host: env.TESTNET_DB_HOST || '0.0.0.0',
        port: parseInt(env.TESTNET_DB_PORT, 10) || 5432,
        database: env.TESTNET_DB_NAME || 'DDK_test',
        password: env.TESTNET_DB_PASSWORD,
        user: env.TESTNET_DB_USER,
        poolSize: 95,
        poolIdleTimeout: 30000,
        reapIntervalMillis: 1000,
        logEvents: [
            'error'
        ]
    },
    redis: {
        host: env.TESTNET_REDIS_HOST || '0.0.0.0',
        port: parseInt(env.TESTNET_REDIS_PORT, 10) || 6380,
        password: env.TESTNET_REDIS_PASSWORD,
        db: 0
    },
    api: {
        enabled: true,
        access: {
            public: true,
            whiteList: [
                '127.0.0.1',
                '192.168.9.91',
                '180.151.225.194',
                '159.65.139.87',
                '118.100.29.72',
                '124.29.212.104',
                '103.201.142.50',
                '18.218.25.187'
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
        list:  (env.TESTNET_PEERS || '').split(',').map(peer => peer.split(':')).map(([ip, port]) => ({ ip, port })),
        access: {
            blackList: (env.TESTNET_PEERS_BLACKLIST || '').split(','),
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
        minBroadhashConsensus: parseInt(env.TESTNET_MIN_CONSENSUS, 10) || 0,
        secret: env.TESTNET_FORGE_SECRET,
        access: {
            whiteList: [
                '127.0.0.1',
                '192.168.9.91',
                '180.151.225.194',
                '118.100.29.72'
            ]
        }
    },
    loading: {
        verifyOnLoading: false,
        loadPerIteration: 5000
    },
    ssl: {
        enabled: true,
        options: {
            port: 443,
            address: env.TESTNET_ADDRESS || '0.0.0.0',
            key: env.TESTNET_SSL_KEY,
            cert: env.TESTNET_SSL_CERT
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
    sender: {},
    nethash: env.NETHASH,
    elasticsearchHost: env.TESTNET_ELASTICSEARCH_HOST || '0.0.0.0:9200',
    swaggerDomain: env.TESTNET_ADDRESS || '0.0.0.0',
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
