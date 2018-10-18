
let env = process.env;

module.exports = {
    port: parseInt(env.PORT, 10) || 7000,
    address: env.MAINNET_ADDRESS || '0.0.0.0',
    version: '0.9.9a',
    minVersion: '>=0.9.0',
    fileLogLevel: 'info',
    logFileName: 'logs/ddk.log',
    consoleLogLevel: 'none',
    trustProxy: false,
    topAccounts: false,
    cacheEnabled: true,
    db: {
        host: env.MAINNET_DB_HOST || '0.0.0.0',
        port: parseInt(env.MAINNET_DB_PORT, 10) || 5432,
        database: env.MAINNET_DB_NAME || 'ddk_mainnet_database',
        password: env.MAINNET_DB_PASSWORD,
        user: env.MAINNET_DB_USER,
        poolSize: 95,
        poolIdleTimeout: 30000,
        reapIntervalMillis: 1000,
        logEvents: [
            'error'
        ]
    },
    dbReplica: {
        host: env.MAINNET_DBREPLICA_HOST || '0.0.0.0',
        port: parseInt(env.MAINNET_DB_PORT, 10) || 5432,
        database: env.MAINNET_DB_NAME || 'ddk_mainnet_database',
        password: env.MAINNET_DB_PASSWORD,
        user: env.MAINNET_DB_USER,
        poolSize: 95,
        poolIdleTimeout: 30000,
        reapIntervalMillis: 1000,
        logEvents: [
            'error'
        ]
    },
    redis: {
        host: env.MAINNET_REDIS_HOST || '0.0.0.0',
        port: parseInt(env.MAINNET_REDIS_PORT, 10) || 6379,
        password: env.MAINNET_REDIS_PASSWORD,
        db: 0
    },
    api: {
        enabled: true,
        access: {
            public: true,
            whiteList: [
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
        list: [
        ],
        access: {
            blackList: []
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
        broadcastLimit: 25,
        parallelLimit: 20,
        releaseLimit: 25,
        relayLimit: 3
    },
    transactions: {
        send: {
            enabled: true,
            access: {
                public: false,
                whiteList: [
                    'DDK5962989209662165330',
                    'DDK2361885483816819618',
                    'DDK4794180832338955412',
                    'DDK10134369479854277931',
                    'DDK361354440390362520',
                    'DDK17776415723808150476',
                    'DDK2663990857073429388',
                    'DDK621307630330036566',
                    'DDK14331965777824934318',
                    'DDK13345059747052406719',
                    'DDK505714245520652558',
                    'DDK15570083636364030285',
                    'DDK244023237568848346',
                    'DDK17822018155842216927',
                    'DDK5285713915190275439',
                    'DDK671763336273170855',
                    'DDK6400294552222229114',
                    'DDK4711304802333146210',
                    'DDK13024125392038572687',
                    'DDK16379166446130400053',
                    'DDK8985925129876246047',
                    'DDK17574015962568339694',
                    'DDK13055233377598230717',
                    'DDK12157234698311703679',
                    'DDK5635654530514348997',
                    'DDK17873805065824783609',
                    'DDK2133244585672096063',
                    'DDK7112776047818854626',
                    'DDK6674249358964596296',
                    'DDK11844411308098998906',
                    'DDK1333927737517462035'
                ]
            },
        },
        maxTxsPerQueue: 1000
    },
    forging: {
        force: true,
        secret: env.MAINNET_FORGE_SECRET,
        access: {
            whiteList: [
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
            address: env.MAINNET_ADDRESS || '0.0.0.0',
            key: env.MAINNET_SSL_KEY,
            cert: env.MAINNET_SSL_CERT
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
    elasticsearchHost: env.MAINNET_ELASTICSEARCH_HOST || '0.0.0.0:9200',
    swaggerDomain: env.MAINNET_ADDRESS || '0.0.0.0',
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
