// run elastic search server using shell script
'use strict';

const exec = require('child_process').exec;

function initElasticSearch(cb) {  
    var result = exec('sh /etc/etp_test/esInit.sh', function(error, stdout, stderr) {
        console.log(`${stdout}`);
        console.log(`${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
        cb(null);
    });
    return result; 
}

exports.initElasticSearch = initElasticSearch;
