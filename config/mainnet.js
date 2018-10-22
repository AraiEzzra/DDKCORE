
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
                    'DDK1333927737517462035',
                    'DDK15552409825250798381',
                    'DDK5077702050253164178',
                    'DDK10558119252620359535',
                    'DDK4945619125930464351',
                    'DDK5698626852018201003',
                    'DDK2073058567633009531',
                    'DDK1558864869769361730',
                    'DDK5279710292760680565',
                    'DDK15747443136492089065',
                    'DDK11476149116352085964',
                    'DDK9458954020043165737',
                    'DDK16572655180379353005',
                    'DDK9777183470136955230',
                    'DDK10989550947742479015',
                    'DDK8325933134814262226',
                    'DDK15612563748851188038',
                    'DDK14168863712168057866',
                    'DDK141097664923140407',
                    'DDK66293296661833771',
                    'DDK1745288898521657943',
                    'DDK129336145504683761',
                    'DDK4325570895783404482',
                    'DDK13552404807419499937',
                    'DDK12214168909214464093',
                    'DDK17231034243517779329',
                    'DDK8887131036822665827',
                    'DDK15296063821473119890',
                    'DDK206980256525738563',
                    'DDK213256244618933621',
                    'DDK3693295673533236006',
                    'DDK13885343235280952316',
                    'DDK13885343235280952316',
                    'DDK3244860064778129760',
                    'DDK13734400198713144506',
                    'DDK16531957984472176041',
                    'DDK18243468281812042524',
                    'DDK13719782410185498283',
                    'DDK12248524789453180582',
                    'DDK3941294764719387109',
                    'DDK4855330693900788394',
                    'DDK13020308334644443391',
                    'DDK12558053402833679113',
                    'DDK16572655180379353005',
                    'DDK5216737955302030643',
                    'DDK7214959811294852078',
                    'DDK17822093414976158652',
                    'DDK7667070886185500599',
                    'DDK4645689941659296442',
                    'DDK2681304213136292013',
                    'DDK13782793764495003320',
                    'DDK16019039878368675759',
                    'DDK17410889289877845885',
                    'DDK767970489876001191',
                    'DDK9779331145851583211',
                    'DDK3107842473442442054',
                    'DDK1681037653800912717',
                    'DDK17285085736760669173',
                    'DDK15420344615617232956',
                    'DDK5478596106367552400',
                    'DDK10770090079539914969',
                    'DDK4873088070995837992',
                    'DDK16616950443204954541',
                    'DDK12167363809298593288',
                    'DDK462783741766158695',
                    'DDK12285680149015610819',
                    'DDK7178982498881607913',
                    'DDK18244733474350654439',
                    'DDK2400935947002104061',
                    'DDK2117162531173841351',
                    'DDK10767824376875457110',
                    'DDK6804780412763750684',
                    'DDK4753859167422022717',
                    'DDK12903634981433410488'
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
