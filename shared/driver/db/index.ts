import pgp, { IMain, IDatabase } from 'pg-promise';
import config from 'shared/config';

const connectionOptions = {
    host: config.DB.HOST,
    port: config.DB.PORT,
    database: config.DB.DATABASE,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    poolSize: config.DB.POOL_SIZE,
    poolIdleTimeout: config.DB.POOL_IDLE_TIMEOUT,
    reapIntervalMillis: config.DB.REAP_INTERVAL_MILLIS,
    logEvents: config.DB.LOG_EVENTS,
};

export const pgpE: IMain = pgp();

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

export default new DatabaseConnector().connector;
