import Loader from 'core/loader';
import db from 'shared/driver/db';
import { expect } from 'chai';

describe('Before all hook for creating DB', () => {

    it('should create tables, flush them and apply genesis block', async () => {
        await Loader.start();
        const tables = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'');
        expect(tables.length).to.be.above(0);
    });
});
