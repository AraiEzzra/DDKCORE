import { Fixture } from 'test/api/base/fixture';
import { API_ACTION_TYPES } from 'shared/driver/socket/codes';
import { socketRequest } from 'test/api/base';
import { expect } from 'chai';
import { sortByKey } from 'shared/util/util';

describe('Test GET_BLOCKS', () => {
    context('Add 10 blocks to DB', async () => {
        const blocks = [];
        const BLOCK_COUNT = 10;

        before(async () => {
            for (let i = 0; i < BLOCK_COUNT; i++) {
                blocks.push(await Fixture.createBlock({ height: 101 + i }));
            }
        });

        it('Positive ', async () => {
            const REQUEST = {
                headers: Fixture.getBaseHeaders(),
                code: API_ACTION_TYPES.GET_BLOCKS,
                body: {
                    sort: [['height', 'DESC']],
                    limit: 8,
                    offset: 2
                }
            };
            const response = await socketRequest(REQUEST);
            expect(response.body.success).to.equal(true);
            const expectedBlocks = blocks.slice(0).sort(sortByKey('height', 'DESC')).slice(2);
            expectedBlocks.forEach((block, index) => {
                expect(response.body.data.blocks[index].id).equal(block.id);
            });
        });

        after(async () => {
            for (const block of blocks) {
                await Fixture.removeBlock(block.id);
            }
        });
    });

    it('Negative', async () => {
        const REQUEST = {
            headers: Fixture.getBaseHeaders(),
            code: API_ACTION_TYPES.GET_BLOCKS,
            body: {}
        };
        const response = await socketRequest(REQUEST);
        expect(response.body.success).to.equal(false);
        expect(response.body.errors).to.deep.equal(
            ['IS NOT VALID REQUEST:\'GET_BLOCKS\'... Missing required property: offset']
        );
    });

});
