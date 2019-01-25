import { redisClient } from 'shared/driver/redis';

export interface ICacheRepository {

    removeByPattern(pattern: string): void;

    deleteJsonByKey(key: string): void;

    hmset(hmset: string): void;

    setJsonByKey(key: string, value: any);

    setJsonByKeyAsync(key: string, value: any);

    getJsonByKey(key: string, value: any);

    getJsonByKeyAsync(key: string, value: any);

    flushDb(): void;

    quit(): void;

    cleanup(): void;

}

export class CacheRepository implements ICacheRepository {
    private static instance: CacheRepository = undefined;
    private redisClient;

    constructor() {
        if (!CacheRepository.instance) {
            CacheRepository.instance = this;
            this.connect();
        }
        return CacheRepository.instance;
    }

    private connect(): void {
        console.log('try to connect redis');
        this.redisClient = redisClient;
    }

    setJsonByKeyAsync(key: string, value: any) {
        throw new Error("Method not implemented.");
    }

    getJsonByKey(key: string, value: any) {
        throw new Error("Method not implemented.");
    }

    getJsonByKeyAsync(key: string, value: any) {
        throw new Error("Method not implemented.");
    }
    removeByPattern(pattern: string): void {
        throw new Error("Method not implemented.");
    }

    deleteJsonByKey(key: string): void {
        throw new Error("Method not implemented.");
    }

    hmset(hmset: string): void {
        throw new Error("Method not implemented.");
    }

    setJsonByKey(key: string, value: any) {
        throw new Error("Method not implemented.");
    }

    flushDb(): void {
        throw new Error("Method not implemented.");
    }

    quit(): void {
        throw new Error("Method not implemented.");
    }

    cleanup(): void {
        throw new Error("Method not implemented.");
    }
}
