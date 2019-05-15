import BlockRepo from 'core/repository/block';
import BlockController from 'core/controller/block';
import { expect } from 'chai';

describe('Loader test', () => {

    it('Positive memory test', async () => {

        const lastBlock = await BlockRepo.getLastBlock();
        const response = await BlockController.onReceiveBlock({
            data: {
                block: {
                    createdAt: 12312312,
                    previousBlockId: '123',
                    transactions: []
                }
            }
        });

        expect(response.success).to.equal(false);
        expect(lastBlock).to.have.property('id');
        expect(lastBlock).to.have.property('transactionCount', 24);
    });
});
