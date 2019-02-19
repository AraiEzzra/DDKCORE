import { CacheRepository, ICacheRepository } from 'shared/repository/cache';
import ResponseEntity from 'shared/model/response';

export const useCache = (expired, client?: ICacheRepository) => {
    const cacheClient: ICacheRepository = client ? client : new CacheRepository();

        return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
            if (descriptor.value != null) {
                let decoratedFn = descriptor.value;

                descriptor.value = async () => {
                    const cacheFromRedis = await cacheClient.get(propertyKey);
                    if (cacheFromRedis.data) {
                        return new ResponseEntity({data: cacheFromRedis});
                    } else {
                        // todo: use arguments as second parameter
                        let data = decoratedFn.apply(target, []);
                        await cacheClient.set(propertyKey, data.data, expired);
                        return data;
                    }
                };

                return descriptor;
            } else {
                throw 'Only put the @memoize decorator on a method.';
            }
        };
};

