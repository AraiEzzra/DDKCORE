/**
 * modules.blocks.submodules.api
 */
const GetBlock = require('./methods/getblock');
const GetBlocks = require('./methods/getblocks');
const GetBroadhash = require('./methods/getbroadhash');
const GetEpoch = require('./methods/getepoch');
const GetHeight = require('./methods/getheight');
const GetFee = require('./methods/getfee');
const GetFees = require('./methods/getfees');
const GetNethash = require('./methods/getnethash');
const GetMilestone = require('./methods/getmilestone');
const GetReward = require('./methods/getreward');
const GetSupply = require('./methods/getsupply');
const GetStatus = require('./methods/getstatus');

/**
 * modules.delegates.internal
 */
const GetForgingStatus = require('./methods/getforgingstatus');

/**
 * modules.transactions.shared
 */
const GetTransaction = require('./methods/gettransaction');
const GetTransactions = require('./methods/gettransactions');
const AddTransaction = require('./methods/addtransaction');

/**
 * modules.peers.shared
 */
const GetPeer = require('./methods/getpeer');
const GetPeers = require('./methods/getpeers');

/**
 * modules.delegates.shared
 */
const GetVoters = require('./methods/getvoters');
const GetDelegate = require('./methods/getdelegate');
const GetDelegates = require('./methods/getdelegates');
const GetNextForgers = require('./methods/getnextforgers');
const Search = require('./methods/search');
const Count = require('./methods/count');
const GetForgedByAccount = require('./methods/getforgedbyaccount');
const AddDelegate = require('./methods/adddelegate');


const methods = [
  GetStatus,
  GetBlock,
  GetBlocks,
  GetTransaction,
  GetTransactions,
  AddTransaction,
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
  AddDelegate,
];

// todo: replace me to config.json
const PORT = 8080;
const HOST = '127.0.0.1';
const VERSION = 1;

module.exports = {
  methods: methods,
  port: PORT,
  host: HOST,
  version: VERSION,
};
