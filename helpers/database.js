let async = require('async');
let bignum = require('./bignum');
let fs = require('fs');
let path = require('path');

/**
 * Migrator functions
 * @class
 * @private
 * @param {Object} pgp - pg promise
 * @param {Object} db - pg connection
 */
function Migrator (pgp, db) {
	/**
	 * Gets one record from `migrations` trable
	 * @method
	 * @param {function} waterCb - Callback function
	 * @return {function} waterCb with error | Boolean
	 */
	this.checkMigrations = function (waterCb) {
		db.one('SELECT to_regclass(\'migrations\')')
			.then(function (row) {
				return waterCb(null, Boolean(row.to_regclass));
			})
			.catch(function (err) {
				return waterCb(err);
			});
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
			.then(function (rows) {
				if (rows[0]) {
					rows[0].id = new bignum(rows[0].id);
				}
				return waterCb(null, rows[0]);
			})
			.catch(function (err) {
				return waterCb(err);
			});
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
		let migrationsPath = path.join(process.cwd(), 'sql', 'migrations');
		let pendingMigrations = [];

		function matchMigrationName (file) {
			let name = file.match(/_.+\.sql$/);

			return Array.isArray(name) ? name[0].replace(/_/, '').replace(/\.sql$/, '') : null;
		}

		function matchMigrationId (file) {
			let id = file.match(/^[0-9]+/);

			return Array.isArray(id) ? new bignum(id[0]) : null;
		}

		fs.readdir(migrationsPath, function (err, files) {
			if (err) {
				return waterCb(err);
			}

			files.map(function (file) {
				return {
					id: matchMigrationId(file),
					name: matchMigrationName(file),
					path: path.join(migrationsPath, file)
				};
			}).filter(function (file) {
				return (
					(file.id && file.name) && fs.statSync(file.path).isFile() && /\.sql$/.test(file.path)
				);
			}).forEach(function (file) {
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
		let appliedMigrations = [];

		async.eachSeries(pendingMigrations, function (file, eachCb) {
			let sql = new pgp.QueryFile(file.path, {minify: true});

			db.query(sql)
				.then(function () {
					appliedMigrations.push(file);
					return eachCb();
				})
				.catch(function (err) {
					return eachCb(err);
				});
		}, function (err) {
			return waterCb(err, appliedMigrations);
		});
	};

	/**
	 * Inserts into `migrations` table the previous applied migrations.
	 * @method
	 * @param {Array} appliedMigrations 
	 * @param {function} waterCb - Callback function
	 * @return {function} waterCb with error
	 */
	this.insertAppliedMigrations = function (appliedMigrations, waterCb) {
		async.eachSeries(appliedMigrations, function (file, eachCb) {
			db.query('INSERT INTO migrations(id, name) VALUES($1, $2) ON CONFLICT DO NOTHING', [file.id.toString(), file.name])
				.then(function () {
					return eachCb();
				})
				.catch(function (err) {
					return eachCb(err);
				});
		}, function (err) {
			return waterCb(err);
		});
	};

	/**
	 * Executes 'runtime.sql' file, that set peers clock to null and state to 1.
	 * @method
	 * @param {function} waterCb - Callback function
	 * @return {function} waterCb with error
	 */
	this.applyRuntimeQueryFile = function (waterCb) {
		let dirname = path.basename(__dirname) === 'helpers' ? path.join(__dirname, '..') : __dirname;
		let sql = new pgp.QueryFile(path.join(dirname, 'sql', 'runtime.sql'), {minify: true});

		db.query(sql)
			.then(function () {
				return waterCb();
			})
			.catch(function (err) {
				console.log('err', err.stack);
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
	let pgOptions = {
		promiseLib: promise
	};

	let pgp = require('pg-promise')(pgOptions);
	let monitor = require('pg-monitor');

	monitor.attach(pgOptions);
	monitor.setTheme('matrix');

	monitor.log = function (msg, info){
		info.display = false;
	};

	let db = pgp(config);

	let migrator = new Migrator(pgp, db);

	async.waterfall([
		migrator.checkMigrations,
		migrator.getLastMigration,
		migrator.readPendingMigrations,
		migrator.applyPendingMigrations,
		migrator.insertAppliedMigrations,
		migrator.applyRuntimeQueryFile
	], function (err) {
		return cb(err, db);
	});
};

/*************************************** END OF FILE *************************************/
