const GetStatus = require('./methods/getstatus');
const GetBlock = require('./methods/getblock');
const GetBlocks = require('./methods/getblocks');
const GetRawTransaction = require('./methods/getrawtransaction');
const GetRawTransactions = require('./methods/getrawtransactions');
const SendRawTransaction = require('./methods/sendrawtransaction');
const GetPeer = require('./methods/getpeer');
const GetPeers = require('./methods/getpeers');

const methods = [
  GetStatus,
  GetBlock,
  GetBlocks,
  GetRawTransaction,
  GetRawTransactions,
  SendRawTransaction,
  GetPeer,
  GetPeers,
];

const PORT = 8080;
const HOST = '127.0.0.1';
const VERSION = 1;

module.exports = {
  methods: methods,
  port: PORT,
  host: HOST,
  version: VERSION,
};

