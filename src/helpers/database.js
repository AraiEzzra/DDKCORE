const async = require('async');
const bignum = require('./bignum');
const fs = require('fs');
const path = require('path');

/**
 * Migrator functions
 * @class
 * @private
 * @param {Object} pgp - pg promise
 * @param {Object} db - pg connection
 */
function Migrator(pgp, db) {
    /**
     * Gets one record from `migrations` trable
     * @method
     * @param {function} waterCb - Callback function
     * @return {function} waterCb with error | Boolean
     */
    this.checkMigrations = function (waterCb) {
        db.one('SELECT to_regclass(\'migrations\')')
            .then(row => waterCb(null, Boolean(row.to_regclass)))
            .catch(err => waterCb(err));
    };

    /**
     * Gets last migration record from `migrations` trable.
     * @method
     * @param {Boolean} hasMigrations
     * @param {function} waterCb - Callback function
     * @return {function} waterCb with error | row data
     */
    this.getLastMigration = function (hasMigrations, waterCb) {
        if (!hasMigrations) {
            return waterCb(null, null);
        }
        db.query('SELECT * FROM migrations ORDER BY "id" DESC LIMIT 1')
            .then((rows) => {
                if (rows[0]) {
                    rows[0].id = new bignum(rows[0].id);
                }
                return waterCb(null, rows[0]);
            })
            .catch(err => waterCb(err));
    };

    /**
     * Reads folder `sql/migrations` and returns files grather than
     * lastMigration id.
     * @method
     * @param {Object} lastMigration
     * @param {function} waterCb - Callback function
     * @return {function} waterCb with error | pendingMigrations
     */
    this.readPendingMigrations = function (lastMigration, waterCb) {
        // TODO: replace with NORMAL config
        const migrationsPath = path.join(process.cwd(), 'src/sql', 'migrations');
        const pendingMigrations = [];

        function matchMigrationName(file) {
            const name = file.match(/_.+\.sql$/);

            return Array.isArray(name) ? name[0].replace(/_/, '').replace(/\.sql$/, '') : null;
        }

        function matchMigrationId(file) {
            const id = file.match(/^[0-9]+/);

            return Array.isArray(id) ? new bignum(id[0]) : null;
        }

        fs.readdir(migrationsPath, (err, files) => {
            if (err) {
                return waterCb(err);
            }

            files.map(file => ({
                id: matchMigrationId(file),
                name: matchMigrationName(file),
                path: path.join(migrationsPath, file)
            })).filter(file => (
                (file.id && file.name) && fs.statSync(file.path).isFile() && /\.sql$/.test(file.path)
            )).forEach((file) => {
                if (!lastMigration || file.id.greaterThan(lastMigration.id)) {
                    pendingMigrations.push(file);
                }
            });

            return waterCb(null, pendingMigrations);
        });
    };

    /**
     * Creates and execute a db query for each pending migration.
     * @method
     * @param {Array} pendingMigrations
     * @param {function} waterCb - Callback function
     * @return {function} waterCb with error | appliedMigrations
     */
    this.applyPendingMigrations = function (pendingMigrations, waterCb) {
        const appliedMigrations = [];

        async.eachSeries(pendingMigrations, (file, eachCb) => {
            const sql = new pgp.QueryFile(file.path, { minify: true });

            db.query(sql)
                .then(() => {
                    appliedMigrations.push(file);
                    return eachCb();
                })
                .catch(err => eachCb(err));
        }, err => waterCb(err, appliedMigrations));
    };

    /**
     * Inserts into `migrations` table the previous applied migrations.
     * @method
     * @param {Array} appliedMigrations
     * @param {function} waterCb - Callback function
     * @return {function} waterCb with error
     */
    this.insertAppliedMigrations = function (appliedMigrations, waterCb) {
        async.eachSeries(appliedMigrations, (file, eachCb) => {
            db.query('INSERT INTO migrations(id, name) VALUES($1, $2) ON CONFLICT DO NOTHING', [file.id.toString(), file.name])
                .then(() => eachCb())
                .catch(err => eachCb(err));
        }, err => waterCb(err));
    };

    /**
     * Executes 'runtime.sql' file, that set peers clock to null and state to 1.
     * @method
     * @param {function} waterCb - Callback function
     * @return {function} waterCb with error
     */
    this.applyRuntimeQueryFile = function (waterCb) {
        const dirname = path.basename(__dirname) === 'helpers' ? path.join(__dirname, '..') : __dirname;
        // TODO: replace with NORMAL config
        const sql = new pgp.QueryFile(path.join(process.cwd(), 'src/sql', 'runtime.sql'), { minify: true });
        db.query(sql)
            .then(() => waterCb())
            .catch((err) => {
                return waterCb(err);
            });
    };
}

/**
 * Connects to the database and performs:
 * - checkMigrations
 * - getLastMigration
 * - readPendingMigrations
 * - applyPendingMigrations
 * - insertAppliedMigrations
 * - applyRuntimeQueryFile
 * @memberof module:helpers
 * @requires pg-promise
 * @requires pg-monitor
 * @implements Migrator
 * @function connect
 * @param {Object} config
 * @param {function} logger
 * @param {function} cb
 * @return {function} error|cb
 */
module.exports.connect = function (config, logger, cb) {

    const promise = require('bluebird');
    const pgOptions = {
        promiseLib: promise
    };

    const pgp = require('pg-promise')(pgOptions);
    const monitor = require('pg-monitor');

    monitor.attach(pgOptions);
    monitor.setTheme('matrix');

    monitor.log = function (msg, info) {
        info.display = false;

        if (info.event === 'query') {
            logger.trace(`SQL query: ${msg}`);
        }
    };

    const db = pgp(config);

    const migrator = new Migrator(pgp, db);

    async.waterfall([
        migrator.checkMigrations,
        migrator.getLastMigration,
        migrator.readPendingMigrations,
        migrator.applyPendingMigrations,
        migrator.insertAppliedMigrations,
        migrator.applyRuntimeQueryFile
    ], err => cb(err, db));
};

/** ************************************* END OF FILE ************************************ */
