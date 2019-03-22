import Loader from 'core/loader';
import db from 'shared/driver/db';
import config from 'shared/util/config';
import BlockService from 'core/service/block';
import { expect } from 'chai';

describe('Before all hook for creating DB', () => {

    it('should create tables, flush them and apply genesis block', async () => {
        await Loader.initDatabase();
        const tables = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'');
        expect(tables.length).to.be.above(0);
        await db.query('SELECT \'TRUNCATE \' || table_name || \';\' FROM information_schema.tables WHERE table_schema=\'public\';');
        await BlockService.applyGenesisBlock(config.genesisBlock);
    });
});
