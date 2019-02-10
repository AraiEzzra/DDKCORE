import { Application } from 'express';
import { IDatabase } from 'pg-promise';
import { setRoute } from './util/decorator';
import { Migrator } from 'core/database/migrator';
import './controller';

export class Loader {

    async runMigrate(db: IDatabase<any>): Promise<boolean> {
        const migrator = new Migrator(db);
        await migrator.run();
        return true;
    }
}

