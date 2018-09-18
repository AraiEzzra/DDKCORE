

let utils = require('./utils');
let sql = require('./sql/accounts.js');
let path = require('path');
let library = {};


exports.attachScope = function (scope) {
	library = scope;
};

/** 
 * @desc update elasticsearch server data every one minute.
 * @desc get data from DDK_test database.
 * @param {Table} blocks
 * @param {Table} dapps
 * @param {Table} delegates
 * @param {Table} mem_accounts
 * @param {Table} migrations
 * @param {Table} rounds_fees
 * @param {Table} trs
 * @param {Table} signatures
 * @param {Table} stake_orders
 * @param {Table} peers
 * @param {Table} peers_dapp
 * @param {Table} intransfer
 * @param {Table} outtransfer
 * @param {Table} multisignatures
*/
exports.updateDataOnElasticSearch = {

	on: '* * * * *',
	job: function () {
		let dbTables = [
			'blocks_list',
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
						let bulk = utils.makeBulk(rows, tableName);
						utils.indexall(bulk, tableName)
							.then(function (result) {
								return null;
								//FIXME: Do further processing on successful indexing on elasticsearch server
							})
							.catch(function (err) {
								library.logger.error('elasticsearch error :'+ err);
								return null;
							});
					}
				})
				.catch(function (err) {
					library.logger.error('database error : '+ err);
					return null;
				});
		});
	},
	spawn: false
};

/** 
 * @desc checks pending stake rewards functionality every day at mid night.
*/
exports.checkFrozeOrders = {

	on: '* * * * *',
	job: function () {
		let date = new Date();
		//FIXME: comment or remove below statement once this goes live
		//library.logic.frozen.checkFrozeOrders();
		if (date.getHours() === 11 && date.getMinutes() === 30) {
			library.logic.frozen.checkFrozeOrders();
		}
	},
	spawn: false
};

/** 
 * @desc archive log files every first day of a month
*/
exports.archiveLogFiles = {

	on: '0 0 1 * *',
	job: function () {
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		if (today.getMonth() !== yesterday.getMonth()) {
			library.logger.archive('start executing archiving files');
			let createZip = require('./create-zip');
			let year = today.getFullYear();
			let month = today.toLocaleString('en-us', { month: 'long' });
			let dir = path.join(__dirname + '/archive/' + year + '/' + month);
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

/** 
 * @desc checks for pending users and unlocks them everyday at midnight
*/
exports.unlockLockedUsers = {

	on: '00 00 00 * * *',
	job: function () {
		library.logger.info('Checking any pending users(contributors, founders etc...) which needs to be unlocked and unlock them at midnight every day');
		library.cache.client.keys('*userTimeHash_*', function (err, userKeys) {
			userKeys.forEach(function (key) {
				library.modules.cache.hgetall(key, function (err, data) {
					let lastBlock = library.modules.blocks.lastBlock.get();
					if (data.endTime < lastBlock.timestamp) {
						library.modules.cache.getJsonForKey('minedContributorsBalance', function (err, contributorsBalance) {
							let totalContributorsBal = parseInt(data.transferedAmount) + parseInt(contributorsBalance);
							library.modules.cache.setJsonForKey('minedContributorsBalance', totalContributorsBal);
						});
						library.db.none(sql.enableAccount, {
							senderId: data.address
						})
							.then(function () {
								library.logger.info(data.address + ' account is unlocked');
								library.cache.client.del('userInfo_' + data.address);
								library.cache.client.del('userTimeHash_' + data.endTime);
								return null;
							})
							.catch(function (err) {
								library.logger.error(err.stack);
								return null;
							});
					}
				});
			});
		});
	},
	spawn: false
};

/*************************************** END OF FILE *************************************/
