/**
 * modules.blocks.submodules.api
 */
const GetBlock = require('./methods/getBlock.js');
const GetBlocks = require('./methods/getBlocks.js');
const GetBroadhash = require('./methods/getBroadhash.js');
const GetEpoch = require('./methods/getEpoch.js');
const GetHeight = require('./methods/getHeight.js');
const GetFee = require('./methods/getFee.js');
const GetFees = require('./methods/getFees.js');
const GetNethash = require('./methods/getNethash.js');
const GetMilestone = require('./methods/getMilestone.js');
const GetReward = require('./methods/getReward.js');
const GetStatus = require('./methods/getStatus.js');
const GetSupply = require('./methods/getSupply.js');

/**
 * modules.delegates.internal
 */
const GetForgingStatus = require('./methods/getForgingStatus.js');

/**
 * modules.transactions.shared
 * modules.transactions.internal
 */
const GetTransaction = require('./methods/getTransaction.js');
const GetTransactions = require('./methods/getTransactions.js');
const AddTransactions = require('./methods/addTransactions.js');
const GetTransactionHistory = require('./methods/getTransactionHistory.js');

/**
 * logic.transactions.shared
 */
const CreateTransaction = require('./methods/createTransaction.js');

/**
 * modules.peers.shared
 */
const GetPeer = require('./methods/getPeer.js');
const GetPeers = require('./methods/getPeers.js');

/**
 * modules.delegates.shared
 */
const GetVoters = require('./methods/getVoters.js');
const GetDelegate = require('./methods/getDelegate.js');
const GetDelegates = require('./methods/getDelegates.js');
const GetNextForgers = require('./methods/getNextForgers.js');
const Search = require('./methods/search');
const GetForgedByAccount = require('./methods/getForgedByAccount.js');
const AddDelegate = require('./methods/addDelegate.js');

/**
 *
 */
const GetBlocksCount = require('./methods/getBlocksCount.js');

/**
 * modules.accounts.shared
 */
const GetBalance = require('./methods/getBalance.js');
const GetAccount = require('./methods/getAccount.js');
const SetAccountAndGet = require('./methods/setAccountAndGet.js');
const GetPublicKey = require('./methods/getPublickey.js');
const GeneratePublicKey = require('./methods/generatePublicKey.js');
const OpenAccount = require('./methods/openAccount.js');


const methods = [
    GetStatus,
    GetBlock,
    GetBlocks,
    GetTransaction,
    GetTransactions,
    AddTransactions,
    GetTransactionHistory,
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
    GetForgedByAccount,
    AddDelegate,
    GetBlocksCount,
    GetBalance,
    GetAccount,
    SetAccountAndGet,
    GetPublicKey,
    GeneratePublicKey,
    CreateTransaction,
    OpenAccount,
];

// todo: replace me to config.json
const env = process.env;
const PORT = 8080;
const HOST = env.ADDRESS || '0.0.0.0';
const VERSION = 1;

module.exports = {
    methods,
    port: PORT,
    host: HOST,
    version: VERSION
};
