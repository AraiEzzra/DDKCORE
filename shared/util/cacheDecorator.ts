import { CacheRepository, ICacheRepository} from 'shared/repository/cache';
import ResponseEntity from 'shared/model/response';

export const useCache = (expired, client?: ICacheRepository) => {
    const cacheClient: ICacheRepository = client ? client : new CacheRepository();

        return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
            if (descriptor.value != null) {
                let decoratedFn = descriptor.value;

                descriptor.value = () => {
                    const cacheFromRedis = cacheClient.getJsonByKey(propertyKey);
                    if (cacheFromRedis.data) {
                        return new ResponseEntity({data: cacheFromRedis});
                    } else {
                        let data = decoratedFn.apply(target, arguments);
                        cacheClient.setJsonByKey(propertyKey, data.data);
                        return data;
                    }
                };

                return descriptor;
            } else {
                throw 'Only put the @memoize decorator on a method.';
            }
        };
};

