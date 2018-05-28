
/**
 * Module dependencies.
 */

var env = process.env;

/**
 * Expose environment configuration
 */

module.exports = {
  redisURL: env.REDIS_URL || env.REDISTOGO_URL || "",
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
  msgServiceAuthKey: env.MSG91_AUTH_KEY,
  mailFrom: env.MAILFROM,
  mailTo: env.MAILTO,
  refershToken: env.REFRESHTOKEN,
  accessToken: env.ACCESSTOKEN,
  clientId: env.CLIENT_ID,
  clientSecret: env.CLIENT_SECRET,
  hashSecret: env.HASH_SECRET,

  /*  TYPE_0: PUBLIC Account 
      TYPE_1: CONTRIBUTORS Account
      TYPE_2: ADVISORS Account
      TYPE_3: TEAMS Account
      TYPE_4: FOUNDERS Account
  */
  users: [
    {
      secret: env.TYPE_0_SECRET,
      publicKey: env.TYPE_0_KEY
    },
    {
      secret: env.TYPE_1_SECRET,
      publicKey: env.TYPE_1_KEY
    },
    {
      secret: env.TYPE_2_SECRET,
      publicKey: env.TYPE_2_KEY
    },
    {
      secret: env.TYPE_3_SECRET,
      publicKey: env.TYPE_3_KEY
    },
    {
      secret: env.TYPE_4_SECRET,
      publicKey: env.TYPE_4_KEY
    }
  ]
};