const ReservedErrorCodes = require('./../errors');
const Transactions = require('../../../modules/transactions');
const Blocks = require('../../../modules/blocks');
const {
  createServerRPCMethod,
} = require('./../util');



const METHOD_NAME = 'getrawtransaction';

/**
 *
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - The results from current execution,
 * @constructor
 */
function GetRawTransaction (wss, params, scope) {

  return new Promise(function (resolve) {

    scope.modules.transactions.shared.getTransactions({body: params}, (err, result) => {
      if (!err) {
        resolve(result);
      } else {
        err(new Error('Error of GetRawTransaction method'))
      }
    });

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetRawTransaction);
