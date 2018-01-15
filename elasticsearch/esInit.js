/* import { setTheme } from 'pg-monitor';
import { setTimeout } from 'timers'; */


'use strict';

const exec = require('child_process').exec;

/* function initElasticSearch(cb) {  
    var result = exec('sh /etc/etp_test/esInit.sh', function(error, stdout, stderr) {
        console.log(`${stdout}`);
        console.log(`${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
        //cb(null);
    });
    return result;
    /* setTimeout(function(){
        return result;
    }, 5000); 
}

exports.initElasticSearch = initElasticSearch; */

var result = exec('sh /etc/etp_test/esInit.sh', function(error, stdout, stderr) {
    console.log(`${stdout}`);
    console.log(`${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    }
});