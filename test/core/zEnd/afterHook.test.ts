import Loader from 'core/loader';
import db from 'shared/driver/db';
import { expect } from 'chai';

describe('After all hook for creating DB', () => {

    it('should create tables, flush them and apply genesis block', async () => {
        const tables = await db.query('SELECT * FROM information_schema.tables WHERE table_schema = \'public\'');
        tables.forEach(async (table) => {
            await db.query('DELETE FROM $1~;', [table.table_name]);
        });
    });
});
