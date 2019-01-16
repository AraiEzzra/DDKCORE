const async = require('async');
const genesisblock = require('../src/helpers/genesisBlock');
const express = require('express');
const program = require('commander');

program
    .version(packageJson.version)
    .option('-c, --config <path>', 'config file path')
    .option('-p, --port <port>', 'listening port number')
    .option('-a, --address <ip>', 'listening host name or ip')
    .option('-x, --peers [peers...]', 'peers list')
    .option('-l, --log <level>', 'log level')
    .option('-s, --snapshot <round>', 'verify snapshot')
    .parse(process.argv);

console.log('env ================  ', program);
