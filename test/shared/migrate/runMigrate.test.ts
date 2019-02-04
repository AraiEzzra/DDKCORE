import path from 'path';
import chai, { expect } from 'chai';
import { QueryFile } from 'pg-promise';
import { DatabaseConnector } from './mock/db';
import { Migrator } from 'core/database/migrator';

describe('Migrate on create tables', () => {
    let db;
    let migrate: Migrator;
    let pathMockData = path.join(process.cwd(), 'test/shared/migrate', 'mock');

    before(async (done) => {
        db = new DatabaseConnector().connector;
        migrate = new Migrator(db);
        done();
    });

    after( (done) => {
        const filePath = path.join(pathMockData, 'dropTables.sql');
        const sql = new QueryFile(filePath, { minify: true });
        db.query(sql)
            .then(() => {
                done();
                return;
            });
    });

    it('It should create tables', async () => {
        await migrate.run();

    });
});
