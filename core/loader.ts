import { IDatabase } from 'pg-promise';
import { Migrator } from 'core/database/migrator';
import controllers from './controller';

export class Loader {

    async runMigrate(db: IDatabase<any>): Promise<boolean> {
        const migrator = new Migrator(db);
        await migrator.run();
        return true;
    }
}

