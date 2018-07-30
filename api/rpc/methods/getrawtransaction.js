const ReservedErrorCodes = require('./../errors');
const Transactions = require('../../../modules/transactions');
const Blocks = require('../../../modules/blocks');
const { createServerRPCMethod, validator } = require('./../util');
const { getTransactions, getTransaction } = require('../../../schema/transactions');


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

    let error;

    if (validator(params, getTransaction)) {
      scope.modules.transactions.shared.getTransaction({body: params}, (errorMessage, result) => {

        resolve(errorMessage
          ? {error: wss.createError(ReservedErrorCodes.ApplicationError, errorMessage)}
          : result);
      });
    }
    else {
      error = wss.createError(ReservedErrorCodes.ServerErrorInvalidMethodParameters, 'Failed operation');
      return {error}
    }

  });
}

module.exports = createServerRPCMethod(METHOD_NAME, GetRawTransaction);
