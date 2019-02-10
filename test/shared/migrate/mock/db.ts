import pgp, { IDatabase } from 'pg-promise';

const connectionOptions = {
    host: '0.0.0.0',
    port: 5432,
    database: 'ddk_test',
    user: 'postgres',
    password: 'postgres',
    poolSize: 95,
    poolIdleTimeout: 30000,
    reapIntervalMillis: 1000,
    logEvents: ['error'],
};

const pgpE = pgp();

export class DatabaseConnector {
    static instance: DatabaseConnector = undefined;
    connector: IDatabase<any>;

    constructor() {
        if (DatabaseConnector.instance === undefined) {
            this.connector = pgpE(connectionOptions);
            DatabaseConnector.instance = this;
        }
        return DatabaseConnector.instance;
    }
}
