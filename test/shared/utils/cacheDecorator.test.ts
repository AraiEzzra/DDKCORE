import { useCache } from 'shared/util/cacheDecorator';
import { ICacheRepository } from 'shared/repository/cache';
import ResponseEntity from 'shared/model/response';
import { expect } from 'chai';

class RedisClient implements ICacheRepository {
    public store: any;

    constructor() {
        this.store = [];
    }

    public getJsonByKey (key): ResponseEntity<any> {
        return new ResponseEntity(
            {
                data: this.store[key],
            });
    }

    public getJsonByKeyAsync(key: string): Promise<ResponseEntity<any>> {
        throw new Error('Method not implemented.');
    }

    public setJsonByKey (key, value) {
        this.store[key] = value;
    }

    public setJsonByKeyAsync(key: string, value: any) {
        throw new Error('Method not implemented.');
    }

    public deleteJsonByKey(key) {
        delete this.store[key];
    }

    public removeByPattern(pattern: string): void {
        throw new Error('Method not implemented.');
    }

    public hmset(hmset: string): void {
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

const redisClient = new RedisClient();

class TestDecorator {
    @useCache(5000, redisClient)
    method (): ResponseEntity<any> {
        return new ResponseEntity({data : {test: 'test'}});
    }

    @useCache(500, redisClient)
    method2 (): ResponseEntity<any> {
        return new ResponseEntity({data : {test: 'test2'}});
    }

}

const test = new TestDecorator();

describe('Cache Decorator', function() {

    it('Get from empty cache', function () {
        expect(redisClient.getJsonByKey('method').data).to.be.equal(undefined);
    });

    it('Run decorated method', function () {
        expect(test.method().data.test).to.be.equal('test');
    });

    it('Get from cache ', function () {
        expect(redisClient.getJsonByKey('method').data.test).to.be.equal('test');
    });

    it('Get from empty cache method2', function () {
        expect(redisClient.getJsonByKey('method2').data).to.be.equal(undefined);
    });

    it('Run decorated method2 ', function () {
        expect(test.method2().data.test).to.be.equal('test2');
    });

    it('Get from empty cache method2', function () {
        expect(redisClient.getJsonByKey('method2').data.test).to.be.equal('test2');
    });

});
