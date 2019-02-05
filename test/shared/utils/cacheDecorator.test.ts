import { useCache } from 'shared/util/cacheDecorator';
import { ICacheRepository } from 'shared/repository/cache';
import ResponseEntity from 'shared/model/response';
import { expect } from 'chai';

class EmulateRedisClient implements ICacheRepository {
    public store: any;

    constructor() {
        this.store = [];
    }

    public async get(key): Promise<ResponseEntity<any>> {
        return new Promise((resolve, reject) => {
            resolve(new ResponseEntity({ data: this.store[key]}));
        });
    }

    public async set(key: string, value: any, expired?: number): Promise<boolean> {
        this.store[key] = {value: value, cached: true};
        return Promise.resolve(true);
    }

    public delete(key): Promise<boolean> {
        return new Promise((resolve) => {
            delete this.store[key];
            resolve(true);
        });
    }

    public removeByPattern(pattern: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    public hmset(key: string, value: object): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    flushDb(): void {
        throw new Error('Method not implemented.');
    }

    quit(): void {
        throw new Error('Method not implemented.');
    }

    cleanup(): void {
        throw new Error('Method not implemented.');
    }
}

const redisClient = new EmulateRedisClient();

class TestDecorator {
    @useCache(5000, redisClient)
    method(): ResponseEntity<any> {
        return new ResponseEntity({data : {test: 'test'}});
    }

    @useCache(500, redisClient)
    method2(): ResponseEntity<any> {
        return new ResponseEntity({data : {test: 'test2'}});
    }

}

const test = new TestDecorator();

describe('CacheDecorator @useCache():: ', () => {

    it('Check @useCache() for method()', async () => {
        let result = await redisClient.get('method');
        expect(!!result.data).equal(false);

        await test.method();
        result = await redisClient.get('method');
        expect(result.data.cached).to.equal(true);
    });

    it('Check @useCache() for method2()', async () => {
        let result = await redisClient.get('method2');
        expect(!!result.data).equal(false);

        await test.method2();
        result = await redisClient.get('method2');
        expect(result.data.cached).to.equal(true);
    });
});
