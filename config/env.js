
/**
 * Module dependencies.
 */

let env = process.env;

/**
 * Expose environment configuration
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
	msgServiceAuthKey: env.MSG91_AUTH_KEY,
	mailFrom: env.MAILFROM,
	mailTo: env.MAILTO,
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
			secret: env.PENDING_GROUP_BONUS_SECRET,
			publicKey: env.PENDING_GROUP_BONUS_KEY
		}
	]
};