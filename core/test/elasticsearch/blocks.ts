import 'module-alias/register';
import { expect } from 'chai';
import * as es from '@core/elasticsearch/newCluster';
import { blockTest } from './mockData/blocks';

const nameIndex = 'blocks_list_test';

describe('Elasticsearch. Index Blocks_list', () => {
    before(`Preparation for test ...`,async () => {
        const result = await es.isIndexExists(nameIndex);
        if (result) {
            await es.deleteIndex(nameIndex);
        }
    });

    it('Must create a new index. ', async () => {
        const result = await es.createIndex(nameIndex);
        expect({
            acknowledged: true,
            shards_acknowledged: true,
            index: nameIndex }).to.deep.equal(result);
    });

    it('Add one document to index', async () => {

    })
});