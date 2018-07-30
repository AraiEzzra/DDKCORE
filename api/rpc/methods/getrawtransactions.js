const ReservedErrorCodes = require('./../errors');
const Transactions = require('../../../modules/transactions');
const Blocks = require('../../../modules/blocks');
const { createServerRPCMethod, validator } = require('./../util');
const { getTransactions } = require('../../../schema/transactions');


const METHOD_NAME = 'getrawtransactions';

/**
 *
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetRawTransactions (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, getTransactions)) {
      scope.modules.transactions.shared.getTransactions({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    }
    else {
      return {error: 'Failed operation'}
    }

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetRawTransactions);
