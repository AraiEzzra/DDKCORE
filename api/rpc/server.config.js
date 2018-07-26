const GetBlock = require('./methods/getblock');
const GetBlocks = require('./methods/getblocks');
const GetRawTransaction = require('./methods/getrawtransaction');
const SendRawTransaction = require('./methods/sendrawtransaction');

const methods = [
  GetBlock,
  GetBlocks,
  GetRawTransaction,
  SendRawTransaction,
];

const PORT = 8080;
const HOST = 'localhost';
const VERSION = 1;


module.exports = {
  methods: methods,
  port: PORT,
  host: HOST,
  version: VERSION,
};