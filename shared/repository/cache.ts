import { redisGetAsync } from 'shared/driver/redis';
import ResponseEntity from 'shared/model/response';
const errorCacheDisabled = 'Cache Unavailable';

export interface ICacheRepository {

    removeByPattern(pattern: string): void;

    deleteJsonByKey(key: string): void;

    hmset(hmset: string): void;

    setJsonByKey(key: string, value: any);

    setJsonByKeyAsync(key: string, value: any);

    getJsonByKey(key: string): ResponseEntity<any>;

    getJsonByKeyAsync(key: string): Promise<ResponseEntity<any>>;

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
        this.cacheClient = redisGetAsync;
    }

    private isConnected() {
        return this.cacheClient && this.cacheClient.ready;
    }

    removeByPattern(pattern: string): void {
    }

    deleteJsonByKey(key: string): void {
    }

    hmset(hmset: string): void {
    }

    setJsonByKey(key: string, value: any) {
    }

    setJsonByKeyAsync(key: string, value: any) {
    }

    getJsonByKey(key: string): ResponseEntity<any> {
        if (!this.isConnected()) {
            return new ResponseEntity({errors: ['errorCacheDisabled'], data: []});
        }
        this.cacheClient.get(key, (err, value) => {
            if (err) {
                return new ResponseEntity({errors: err, data: value});
            }
            // parsing string to json
            return new ResponseEntity({errors: err, data: JSON.parse(value)});
        });
    }

    getJsonByKeyAsync(key: string): Promise<ResponseEntity<any>> {
        return undefined;
    }

    flushDb(): void {
    }

    quit(): void {
    }

    cleanup(): void {
    }

}
