const GetStatus = require('./methods/getstatus');
const GetBlock = require('./methods/getblock');
const GetBlocks = require('./methods/getblocks');
const GetRawTransaction = require('./methods/getrawtransaction');
const GetRawTransactions = require('./methods/getrawtransactions');
const SendRawTransaction = require('./methods/sendrawtransaction');
const GetPeer = require('./methods/getpeer');
const GetPeers = require('./methods/getpeers');
const GetBroadhash = require('./methods/getbroadhash');
const GetEpoch = require('./methods/getepoch');
const GetFee = require('./methods/getfee');
const GetFees = require('./methods/getfees');
const GetForgingStatus = require('./methods/getforgingstatus');
const GetHeight = require('./methods/getheight');
const GetMilestone = require('./methods/getmilestone');
const GetNethash = require('./methods/getnethash');
const GetReward = require('./methods/getreward');
const GetSupply = require('./methods/getsupply');
const GetVoters = require('./methods/getvoters');
const GetDelegate = require('./methods/getdelegate');
const GetDelegates = require('./methods/getdelegates');
const GetNextForgers = require('./methods/getnextforgers');
const Search = require('./methods/search');
const Count = require('./methods/count');
const GetForgedByAccount = require('./methods/getforgedbyaccount');

const methods = [
  GetStatus,
  GetBlock,
  GetBlocks,
  GetRawTransaction,
  GetRawTransactions,
  SendRawTransaction,
  GetPeer,
  GetPeers,
  GetBroadhash,
  GetEpoch,
  GetFee,
  GetFees,
  GetForgingStatus,
  GetHeight,
  GetMilestone,
  GetNethash,
  GetReward,
  GetSupply,
  GetVoters,
  GetDelegate,
  GetDelegates,
  GetNextForgers,
  Search,
  Count,
  GetForgedByAccount,
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

