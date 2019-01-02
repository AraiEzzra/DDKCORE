

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

let esIterationFinished = true;
let limit = 5000;
let dbTables = [
	{
		tableName: 'blocks_list',
		fieldName: 'b_height',
		lastValue: 0
	},
	{
        tableName: 'trs',
        fieldName: 'rowId',
        lastValue: 0
	},
	{
        tableName: 'stake_orders',
        fieldName: 'stakeId',
        lastValue: 0
	}
];

const iterate = async (table, limit, rowsAcc, bulkAcc, lastValue) => {
    if (!lastValue) {
        lastValue = table.lastValue;
    }
    try {
        rowsAcc = await library.db.manyOrNone(
            'SELECT * FROM $(tableName~) WHERE $(fieldName~) > $(lastValue) ORDER BY $(fieldName~) LIMIT $(limit)',
            {
                tableName: table.tableName,
                fieldName: table.fieldName,
                lastValue: lastValue,
                limit: limit
            }
        );
        if (rowsAcc.length < 1) {
            table.lastValue = lastValue;
            return ;
        }
        bulkAcc = utils.makeBulk(rowsAcc, table.tableName);
        await utils.indexall(bulkAcc, table.tableName);
        lastValue = rowsAcc[rowsAcc.length - 1][table.fieldName];
    } catch(err) {
        library.logger.error('elasticsearch indexing error : '+ err);
    }

    await iterate(table, limit, rowsAcc, bulkAcc, lastValue);
};


exports.updateDataOnElasticSearch = {

	on: '* * * * *',
	job: function () {
		if (!esIterationFinished) {
			return;
		}
        esIterationFinished = false;

		// let dbTables = [
		// 	'blocks_list',
		// 	'dapps',
		// 	'delegates',
		// 	'mem_accounts',
		// 	'migrations',
		// 	'rounds_fees',
		// 	'trs',
		// 	'votes',
		// 	'signatures',
		// 	'stake_orders',
		// 	'peers',
		// 	'peers_dapp',
		// 	'intransfer',
		// 	'outtransfer',
		// 	'multisignatures'
		// ];
		
		let promises = [];
		dbTables.forEach(function (table) {
            promises.push(iterate(table, limit, [], []));
		});
		Promise.all(promises).then( () => {
            esIterationFinished = true;
		});
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

/*************************************** END OF FILE *************************************/
