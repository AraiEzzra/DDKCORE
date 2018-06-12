

var utils = require('./utils');
var sql = require('./sql/accounts.js');
var path = require('path');
var library = {};


exports.attachScope = function (scope) {
	library = scope;
};

// Save data on elasticsearch server
exports.updateDataOnElasticSearch = {

	on: '* * * * *',
	job: function () {
		var dbTables = [
			'blocks',
			'dapps',
			'delegates',
			'mem_accounts',
			'migrations',
			'rounds_fees',
			'trs',
			'votes',
			'signatures',
			'stake_orders',
			'peers',
			'peers_dapp',
			'intransfer',
			'outtransfer',
			'multisignatures'
		];

		dbTables.forEach(function (tableName) {
			library.db.query('SELECT * FROM ' + tableName)
				.then(function (rows) {
					if (rows.length > 0) {
						var bulk = utils.makeBulk(rows, tableName);
						utils.indexall(bulk, tableName)
							.then(function (result) {
								//FIXME: Do further processing on successful indexing on elasticsearch server
							})
							.catch(function (err) {
								library.logger.error('elasticsearch error :', err);
							});
					}
				})
				.catch(function (err) {
					library.logger.error('database error : ', err);
				});
		});
	},
	spawn: false
};

// daily check and update stake_orders, if any Active order expired or not
exports.checkFrozeOrders = {

	on: '* * * * *',
	job: function () {
		var date = new Date();
		library.logic.frozen.checkFrozeOrders(); //For testing purpose only
		if (date.getHours() === 10 && date.getMinutes() === 20) { // Check the time

			library.logic.frozen.checkFrozeOrders();
		}
	},
	spawn: false
};

// archive log files on first day of every month
exports.archiveLogFiles = {

	on: '0 0 1 * *',
	job: function () {
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		if (today.getMonth() !== yesterday.getMonth()) {
			library.logger.archive('start executing archiving files');
			var createZip = require('./create-zip');
			var year = today.getFullYear();
			var month = today.toLocaleString('en-us', { month: 'long' });
			var dir = path.join(__dirname + '/archive/' + year + '/' + month);
			createZip.createDir(dir, function (err) {
				if (!err) {
					createZip.archiveLogFiles(dir, function (err) {
						if (!err) {
							library.logger.archive('files are archived');
						} else {
							library.logger.archive('archive error : ' + err);
						}
					});
				} else {
					library.logger.archive('directory creation error : ' + err);
				}
			});
		}
	},
	spawn: false
};

// Unlock pending users everyday at midnight i.e 12AM
exports.unlockLockedUsers = {

	on: '00 00 00 * * *',
	job: function () {
		library.logger.info('Checking any pending users(contributors, founders etc...) which needs to be unlocked and unlock them at midnight every day');
		library.cache.client.keys('*userTimeHash_*', function (err, userKeys) {
			userKeys.forEach(function (key) {
				library.modules.cache.hgetall(key, function (err, data) {
					var lastBlock = library.modules.blocks.lastBlock.get();
					if (data.endTime < lastBlock.timestamp) {
						library.modules.cache.getJsonForKey('minedContributorsBalance', function (err, contributorsBalance) {
							var totalContributorsBal = parseInt(data.transferedAmount) + parseInt(contributorsBalance);
							library.modules.cache.setJsonForKey('minedContributorsBalance', totalContributorsBal);
						});
						library.db.none(sql.enableAccount, {
							senderId: data.address
						})
							.then(function () {
								library.logger.info(data.address + ' account is unlocked');
								library.cache.client.del('userInfo_' + data.address);
								library.cache.client.del('userTimeHash_' + data.endTime);
							})
							.catch(function (err) {
								library.logger.error(err.stack);
							});
					}
				});
			});
		});
	},
	spawn: false
};