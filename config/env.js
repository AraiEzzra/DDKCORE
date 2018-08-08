
let env = process.env;

/**
 * 
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
 * @param Object mailFrom, mailTo, accessToken, clientId, clientSecret, hashSecret - cridentials required for emails service
 * @param Object users - users list
 * @return Object - with environment credentials
 * 
*/
 

module.exports = {
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
    port: env.PORT
  },
  forging: {
    secret: env.FORGE_SECRET
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
  sender: {
    secret: env.ADMIN_SECRET,
    publicKey: env.ADMIN_PUBLICKEY,
    address: env.ADMIN_ADDRESS 
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
  users: [
    {
      secret: env.PUBLIC_SECRET,
      publicKey: env.PUBLIC_KEY
    },
    {
      secret: env.CONTRIBUTORS_SECRET,
      publicKey: env.CONTRIBUTORS_KEY
    },
    {
      secret: env.ADVISORS_SECRET,
      publicKey: env.ADVISORS_KEY
    },
    {
      secret: env.TEAMS_SECRET,
      publicKey: env.TEAMS_KEY
    },
    {
      secret: env.FOUNDERS_SECRET,
      publicKey: env.FOUNDERS_KEY
    },
    {
      keys: env.PENDING_GROUP_BONUS_KEYS
    }
  ],  
};

/*************************************** END OF FILE *************************************/
