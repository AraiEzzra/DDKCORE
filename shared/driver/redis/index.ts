import redis, { ClientOpts } from 'redis';
const { promisify } = require('util');

export const redisOptions: ClientOpts = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6380,
};

export const redisClient = redis.createClient(redisOptions);

redisClient.on('connect', function() {
    console.log(`Redis connected on: ${redisOptions.host}:${redisOptions.port}`);
});

redisClient.on('error', function(err: any) {
    console.log('Error ' + err);
});

export const redisGetAsync = promisify(redisClient.get).bind(redisClient);
