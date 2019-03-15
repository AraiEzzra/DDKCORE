import { redisClientAsync, redisClient } from 'shared/driver/redis';
import { ResponseEntity } from 'shared/model/response';
const errorCacheDisabled = 'Cache Unavailable';

export interface ICacheRepository {

    removeByPattern(pattern: string): Promise<boolean>;

    delete(key: string): Promise<boolean>;

    hmset(key: string, value: object): Promise<boolean>;

    set(key: string, value: any, expired?: number): Promise<boolean>;

    get(key: string): Promise<ResponseEntity<any>>;

    flushDb(): void;

    quit(): void;

    cleanup(): void;

}

export class CacheRepository implements ICacheRepository {
    private static instance: CacheRepository = undefined;
    private cacheClient;

    constructor() {
        if (!CacheRepository.instance) {
            CacheRepository.instance = this;
            this.connect();

        }
        return CacheRepository.instance;
    }

    private connect(): void {
        this.cacheClient = redisClient;

        this.cacheClient.on('ready', () => {
            this.cacheClient.ready = true;
        });
    }

    private isConnected() {
        return this.cacheClient && this.cacheClient.ready;
    }

    async removeByPattern(pattern: string): Promise<boolean> {
        if (!this.isConnected()) {
            return false;
        }

        let keys, cursor = 0;

        const scan = async (ptrn) => {
            const res = await redisClientAsync.scan(cursor, 'MATCH', ptrn);

            cursor = res[0];
            if (cursor === 0) {
                return true;
            }

            keys = res[1];

            if (keys.length > 0) {
                await redisClientAsync.del(keys);
            } else {
                return scan(ptrn);
            }
        };

        try {
            await scan(pattern);
        } catch (err) {
            return err;
        }

        return true;
    }

    async delete(key: string): Promise<boolean> {
        if (!this.isConnected()) {
            return false;
        }

        return !!await redisClientAsync.del(key);
    }

    async hmset(key: string, value: object): Promise<boolean> {
        if (!this.isConnected()) {
            return false;
        }

        return !!await redisClientAsync.hmset(key, value);
    }

    async set(key: string, value: any, expire?: number): Promise<boolean> {
        if (!this.isConnected()) {
             return false;
        }

        const jsonValue = JSON.stringify(value);

        if (expire) {
            return !!await redisClientAsync.setex(key, expire, jsonValue);
        } else {
            return !!await redisClientAsync.set(key, jsonValue);
        }
    }

    async get(key: string): Promise<ResponseEntity<any>> {
        if (!this.isConnected()) {
            return new ResponseEntity({ errors: [errorCacheDisabled]});
        }

        let result = await redisClientAsync.get(key);

        return new ResponseEntity({
            data: JSON.parse(result)
        });
    }

    flushDb(): void {
        throw 'Not implement yet';
    }

    quit(): void {
        throw 'Not implement yet';
    }

    cleanup(): void {
        throw 'Not implement yet';
    }

}
