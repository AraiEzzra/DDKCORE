const env = process.env;

/**
 * @desc loads environment variables
 * @param String redisURL - redis URL to connect to
 * @param Object db - get db password
 * @param Object redis - get redis password
 * @param Object session - get session secret
 * @param Object forging - get forging secret
 * @param Object ssl - get ssl key & cert
 * @param Object dapp - get dapp master pasowrd
 * @param Object sender - get sender(public address) details required to send transation
 * @param String nethash - get blockchain's nethash
 * @param String jwt - get secret for JSON Web Token
 * @param Object mailFrom, mailTo, accessToken, clientId, clientSecret,
 * hashSecret - cridentials required for emails service
 * @param Object users - users list
 * @return Object - with environment credentials
 *
 */

export default {
    redisURL: env.REDIS_URL || env.REDISTOGO_URL || '',
    db: {
        password: env.DB_PASSWORD
    },
    redis: {
        password: env.REDIS_PASSWORD
    },
    session: {
        secret: env.SESSION_SECRET
    },
    app: {
        port: parseInt(env.PORT, 10)
    },
    peers: {
        list: (env.PEERS || '').split(',').map(peer => peer.split(':')).map(([ip, port]) => ({ ip, port })),
    },
    forging: {
        secret: env.FORGE_SECRET,
        totalSupplyAccount: env.TOTAL_SUPPLY_ACCOUNT,
        stopForging: (env.STOP_FORGING || 'FALSE').toUpperCase() === 'TRUE',
    },
    ssl: {
        options: {
            key: env.SSL_KEY,
            cert: env.SSL_CERT
        }
    },
    dapp: {
        masterpassword: env.DAPP_MASTERPASSWORD
    },
    nethash: env.NETHASH,
    jwt: {
        secret: env.JWT_SECRET,
    },
    mailFrom: env.MAIL_FROM,
    mailTo: env.MAILTO,
    accessToken: env.ACCESSTOKEN,
    clientId: env.CLIENT_ID,
    clientSecret: env.CLIENT_SECRET,
    hashSecret: env.HASH_SECRET,
    silent: env.SILENT,
    debug: env.DEBUG,
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
    ],
};

