import pgp, { IDatabase } from 'pg-promise';
const DEFAULT_PG_PORT = 5432;

const connectionOptions = {
    host: process.env.DB_HOST || '0.0.0.0',
    port: parseInt(process.env.DB_PORT, 10) || DEFAULT_PG_PORT,
    database: process.env.DB_NAME || 'DDK_test',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || 'password',
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

export default new DatabaseConnector().connector;
