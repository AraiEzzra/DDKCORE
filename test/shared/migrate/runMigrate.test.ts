import fs from 'fs';
import path from 'path';
import chai, { expect } from 'chai';
import { IDatabase, QueryFile } from 'pg-promise';
import { DatabaseConnector } from './mock/db';
import { Migrator } from 'core/database/migrator';

describe('Migrate on create tables', () => {
    let migrate: Migrator;
    let pathSQL;

    before(async (done) => {
        pathSQL = path.join(process.cwd(), 'test/shared/migrate', 'mock');
        const db = new DatabaseConnector();
        migrate = new Migrator(db.connector);
        done();
    });

    it('It should create tables', async () => {
        await migrate.run();
    });
});
