import redis, { ClientOpts } from 'redis';
import { logger } from 'shared/util/logger';
const { promisify } = require('util');
const port = 6380;
export const redisOptions: ClientOpts = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || port,
};

export const redisClient = redis.createClient(redisOptions);

redisClient.on('connect', function() {
    logger.debug(`Redis connected on: ${redisOptions.host}:${redisOptions.port}`);
});

redisClient.on('error', function(err: any) {
    logger.debug('Error ' + err);
});

export const redisClientAsync = {
    get: promisify(redisClient.get).bind(redisClient),
    set: promisify(redisClient.set).bind(redisClient),
    del: promisify(redisClient.del).bind(redisClient),
    scan: promisify(redisClient.scan).bind(redisClient),
    hmset: promisify(redisClient.hmset).bind(redisClient),
    setex: promisify(redisClient.setex).bind(redisClient)
};
