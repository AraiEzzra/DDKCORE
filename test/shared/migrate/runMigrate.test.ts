import path from 'path';
import { expect } from 'chai';
import { QueryFile } from 'pg-promise';
import { DatabaseConnector } from './mock/db';
import { Migrator } from 'core/database/migrator';

describe('Migrate on create tables', () => {
    let db;
    let migrate: Migrator;
    let pathMockData: string = path.join(process.cwd(), 'test/shared/migrate', 'mock');

    before(async (done) => {
        db = new DatabaseConnector().connector;
        migrate = new Migrator(db);
        done();
    });

    after( (done) => {
        const sql = getSQLRequest('dropTables.sql');
        db.query(sql)
            .then(() => {
                migrate = pathMockData = db = null;
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it('It should create tables', (done) => {
        migrate.run()
            .then(() => {
                const sql = getSQLRequest('getTables.sql');
                db.query(sql)
                    .then((result) => {
                        expect(result).to.be.an.instanceOf(Array);
                        expect(result).to.not.be.empty;
                        expect(result[0]).to.have.property('name');
                        expect(result[0]).to.have.property('id');
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
    });

    it('It should to exist tables', (done) => {
        const sql = getSQLRequest('isExistTable.sql');
        db.query(sql)
            .then((result) => {
                expect(result).to.be.an.instanceOf(Array);
                expect(result).to.not.be.empty;
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    const getSQLRequest = (fileSQL: string): QueryFile => {
        const filePath = path.join(pathMockData, fileSQL);
        return new QueryFile(filePath, { minify: true });
    };

});
