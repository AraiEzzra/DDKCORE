import { useCache } from '../../../shared/util/cacheDecorator';
import { expect } from 'chai';

class RedisClient {
    private store: any;
    isConnected = false;

    constructor() {
        this.store = [];
        this.isConnected = true;
    }
    public get (key) {
        console.log('Try to get ', key);
        return this.store[key];
    }
    public set (key, value) {
        console.log('Try to set ', key, value);
        this.store[key] = value;

        if (this.store[key]) {
            return true;
        }
    }
}

let redisClient = new RedisClient();

describe('Mock redis', function() {
    it('Client set :: ', function () {
        expect(redisClient.set('test', 'test')).to.equal(true);
    });
    it('Client get ::', function () {
        expect(redisClient.get('test')).to.equal('test');
    });
});

class TestDecorator {
    @useCache(500, redisClient)
    method () {
        return 7;
    }
    @useCache(2, redisClient)
    method2 () {
        return 2;
    }
}

const test = new TestDecorator();
console.log('test', test);

describe('Cache Decorator', function() {
    it('Set test', function () {
        expect(test.method()).to.equal(7);
    });

    it('Set test', function () {
        expect(test.method2()).to.equal(2);
    });

});
