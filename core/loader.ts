import { Application } from 'express';
import { IDatabase } from 'pg-promise';
import { setRoute } from './util/decorator';
import { Migrator } from 'core/database/migrator';
import './controller';

export class Loader {

    initRoute(app: Application) {
        setRoute(app);
    }

    async runMigrate(db: IDatabase<any>) {
        const migrator = new Migrator(db);
        await migrator.run();
    }

}

