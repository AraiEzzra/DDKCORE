import { CacheRepository } from 'shared/repository/cache';
import { expect } from 'chai';

const redisRepository = new CacheRepository();
const CACHE_KEY = 'CACHE_KEY' + Math.random();

describe('Shared CacheRepository methods:: ', function() {
    
    it('redisRepository.set(CACHE_KEY, {test: \'dataForTest\'}) ', async () => {
        const result = await redisRepository.set(CACHE_KEY, {test: 'dataForTest'});
        expect(result).to.be.equal(true);
    });

    it('redisRepository.get(CACHE_KEY) ', async () => {
        let result = await redisRepository.get(CACHE_KEY);
        expect(result.data.test).to.be.equal('dataForTest');
    });

    it('redisRepository.delete(CACHE_KEY) ', async () => {
        const result = await redisRepository.delete(CACHE_KEY);
        expect(result).to.be.equal(true);
    });

    it('redisRepository.hmset(CACHE_KEY, object) ', async () => {
        const obj = {
            field1: 'value1',
            field2: 'value2',
            field3: 'value3',
        };
        const status = await redisRepository.hmset(CACHE_KEY, obj);
        await expect(status).to.be.equal(true);
        await redisRepository.delete(CACHE_KEY);
    });
});
