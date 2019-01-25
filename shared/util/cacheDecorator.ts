interface IUseCache {
    get(key: string): any;
    set(ket: string, value: any): any;
}

export const useCache = function (expired, client?: IUseCache) {
    let cacheClient: IUseCache;
    if (client) {
        cacheClient = client;
        // case for testing
    } else {
        // use true client
    }

    return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (descriptor.value != null) {
            const cacheFromRedis = cacheClient.set(propertyKey, expired);
            if (cacheFromRedis) {

            }
            let decoratedFn = descriptor.value;

            let newFn = function () {
                let object = decoratedFn.apply(target, arguments);

            };

            descriptor.value = newFn;

            return descriptor;
        } else {
            throw 'Only put the @memoize decorator on a method.';
        }
    };
};

