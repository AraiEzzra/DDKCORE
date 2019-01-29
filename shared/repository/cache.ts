import { redisClient } from 'shared/driver/redis';
import ResponseEntity from 'shared/model/response';
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

    removeByPattern(pattern: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.isConnected()) {
                resolve(false);
            }

            const cb = (err) => {
                err ? resolve(false) : resolve(true);
            };

            // this.cacheClient.hmset(key, value, cb);
        });

    }

    delete(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                reject(false);
            }
            const cb = (err) => {
                err ? resolve(false) : resolve(true);
            };

            this.cacheClient.del(key, cb);
        });

    }

    hmset(key: string, value: object): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.isConnected()) {
                resolve(false);
            }

            const cb = (err) => {
                err ? resolve(false) : resolve(true);
            };

            this.cacheClient.hmset(key, value, cb);
        });
    }

    async set(key: string, value: any, expire?: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                reject(new ResponseEntity({ errors: [errorCacheDisabled]}));
            }
            const jsonValue = JSON.stringify(value);

            const cb = (err) => {
                err ? resolve(false) : resolve(true);
            };

            if (expire) {
                this.cacheClient.setex(key, expire, jsonValue, cb);
            } else {
                this.cacheClient.set(key, jsonValue, cb);
            }
        });
    }

    async get(key: string): Promise<ResponseEntity<any>> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                reject(new ResponseEntity({ errors: [errorCacheDisabled]}));
            }
            this.cacheClient.get(key, (err, value) => {
                if (err) {
                    reject(new ResponseEntity({ errors: [err]}));
                }
                resolve(new ResponseEntity({ data: JSON.parse(value)}));
            });
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
