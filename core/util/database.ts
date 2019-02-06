import { IDatabase } from 'pg-promise';

export class Migrator {
    private db: IDatabase<any>;

    constructor(db: IDatabase<any>) {
        this.db = db;
    }


}
