import redis, { ClientOpts } from 'redis';
const { promisify } = require('util');

const defaultPortRedis = 6380;
export const redisOptions: ClientOpts = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || defaultPortRedis,
};

export const redisClient = redis.createClient(redisOptions);

redisClient.on('connect', function() {
    console.log(`Redis connected on: ${redisOptions.host}:${redisOptions.port}`);
});

redisClient.on('error', function(err: any) {
    console.log('Error ' + err);
});

export const redisGetAsync = promisify(redisClient.get).bind(redisClient);
