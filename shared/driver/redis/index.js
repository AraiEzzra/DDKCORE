"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redis_1 = require("redis");
var promisify = require('util').promisify;
exports.redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6380,
};
exports.redisClient = redis_1.default.createClient(exports.redisOptions);
exports.redisClient.on('connect', function () {
    console.log("Redis connected on: " + exports.redisOptions.host + ":" + exports.redisOptions.port);
});
exports.redisClient.on('error', function (err) {
    console.log('Error ' + err);
});
exports.redisGetAsync = promisify(exports.redisClient.get).bind(exports.redisClient);
