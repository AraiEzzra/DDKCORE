'use strict';

var utils = require('./utils');
var library = {};


exports.attachScope = function (scope) {
    library = scope;
};

// Save data on elasticsearch server
exports.updateDataOnElasticSearch = {

    on: "* * * * *",
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
}

// daily check and update stake_orders, if any Active order expired or not
exports.checkFrozeOrders = {

    on: "* * * * *",
    job: function () {
        var date = new Date();
        library.logic.frozen.checkFrozeOrders(); //For testing purpose only
        if (date.getHours() === 10 && date.getMinutes() === 20) { // Check the time

            library.logic.frozen.checkFrozeOrders();
        }
    },
    spawn: false
}

// archive log files on first day of every month
exports.archiveLogFiles = {

    on: "* * * * *",
    job: function () {
        var date = new Date();
        library.modules.cache.isExists('isArchived', function (err, isExist) {
            if (!isExist) {
                library.modules.cache.setJsonForKey('isArchived', false);
            }
            library.modules.cache.getJsonForKey('isArchived', function (err, isArchived) {
                if (date.getDate() === 1 && !isArchived) {
                    library.modules.cache.setJsonForKey('isArchived', true);
                    logger.archive('start executing archiving files');
                    var createZip = require('./create-zip');
                    var year = date.getFullYear();
                    var month = date.toLocaleString("en-us", { month: "long" });
                    var dir = path.join(__dirname + '/archive/' + year + '/' + month);
                    createZip.createDir(dir, function (err) {
                        if (!err) {
                            createZip.archiveLogFiles(dir, function (err) {
                                if (!err) {
                                    logger.archive('files are archived');
                                } else {
                                    logger.archive('archive error : ' + err);
                                }
                            });
                        } else {
                            logger.archive('directory creation error : ' + err);
                        }
                    });
                }
            });
        });
    },
    spawn: false
} 
