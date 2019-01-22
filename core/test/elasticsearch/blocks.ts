import 'module-alias/register';
import { expect } from 'chai';
import * as es from 'core/elasticsearch/newCluster';
import { blockTest, blocksArray } from './mockData/blocks';
import { trsArray } from './mockData/trs';

const nameIndex = 'index_test';
const lengthBulk = 6;
const lengthArr = 3;

describe('Elasticsearch. Index Blocks_list', () => {
    beforeEach(`Before all. Create Index...`, async () => {
        const result = await es.isIndexExists(nameIndex);
        if (result) {
            await es.deleteIndex(nameIndex);
        }
        await es.createIndex(nameIndex);
    });

    afterEach(`After all. Create Index...`, async () => {
        await es.deleteIndex(nameIndex);
    });

    it('Add one document to index', async () => {
        const doc = await es.addDocument({
            index: nameIndex,
            type: nameIndex,
            id: blockTest.b_id,
            body: blockTest
        });
        expect(doc.result).to.equal('created');
    });

    it('Add array documents to index.(Block)', async () => {
        const bulk = es.makeBulk(blocksArray, nameIndex);
        expect(bulk).to.lengthOf(lengthBulk, 'Check function makeBulk.');
        expect(bulk[1]).to.have.property('b_id');
        const result = await es.indexall(bulk, nameIndex);
        expect(result.errors).to.equal(false);
        expect(result.items.length).to.equal(lengthArr);
    });

    it('Add array documents to index.(Transaction)', async () => {
        const bulk = es.makeBulk(trsArray, nameIndex);
        expect(bulk).to.lengthOf(lengthBulk, 'Check function makeBulk.');
        expect(bulk[1]).to.have.property('id');

        const result = await es.indexall(bulk, nameIndex);
        expect(result.errors).to.equal(false);
        expect(result.items.length).to.equal(lengthArr);
    });
});
