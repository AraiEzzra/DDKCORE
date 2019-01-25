"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCache = function (expired, client) {
    var cacheClient;
    if (client) {
        cacheClient = client;
        // case for testing
    }
    else {
        // use true client
    }
    return function (target, propertyKey, descriptor) {
        if (descriptor.value != null) {
            // const cacheFromRedis = cacheClient.set(propertyKey, expired);
            var decoratedFn_1 = descriptor.value;
            var newFn = function () {
                var object = decoratedFn_1.apply(target, arguments);
                console.log("RETURNING VALUE ", object);
            };
            descriptor.value = newFn;
            return descriptor;
        }
        else {
            throw 'Only put the @memoize decorator on a method.';
        }
    };
};
