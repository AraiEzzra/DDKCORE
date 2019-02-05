import path from 'path';
import { expect } from 'chai';
import { QueryFile } from 'pg-promise';
import { DatabaseConnector } from './mock/db';
import { Migrator } from 'core/database/migrator';

describe('Migrate on create tables', () => {
    let db;
    let migrate: Migrator;
    let pathMockData: string = path.join(process.cwd(), 'test/shared/migrate', 'mock');

    before((done) => {
        db = new DatabaseConnector().connector;
        migrate = new Migrator(db);
        done();
    });

    after( async () => {
        const sql = getSQLRequest('dropTables.sql');
        await db.query(sql);
        migrate = pathMockData = db = null;
    });

    it('It should create tables', async () => {
        let result;
        let error;

        try {
            await migrate.run();
            const sql = getSQLRequest('getTables.sql');
            result = await db.query(sql);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.undefined;
        expect(result).to.be.an.instanceOf(Array);
        expect(result).to.not.be.empty;
        expect(result[0]).to.have.property('name');
        expect(result[0]).to.have.property('id');
    });

    it('It should to exist tables', async () => {
        let result;
        let error;

        try {
            const sql = getSQLRequest('isExistTable.sql');
            result = await db.query(sql);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.undefined;
        expect(result).to.be.an.instanceOf(Array);
        expect(result).to.not.be.empty;
    });

    const getSQLRequest = (fileSQL: string): QueryFile => {
        const filePath = path.join(pathMockData, fileSQL);
        return new QueryFile(filePath, { minify: true });
    };
});
