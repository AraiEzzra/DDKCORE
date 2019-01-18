import pgp, { IDatabase } from 'pg-promise';

const dbOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolSize: 95,
    poolIdleTimeout: 30000,
    reapIntervalMillis: 1000,
    logEvents: ['error'],
};

const pgInstance = pgp();

export class DBC {
    static instance: DBC = undefined;
    connector: IDatabase<any>;

    constructor() {
        if (DBC.instance === undefined) {
            this.connector = pgInstance(dbOptions);
            DBC.instance = this;
        }
        return DBC.instance;
    }
}

const dbc = new DBC().connector;
export default dbc;
