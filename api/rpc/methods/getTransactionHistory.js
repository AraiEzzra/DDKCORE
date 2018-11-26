const { createServerRPCMethod, validator } = require('./../util');
const ReservedError = require('./../errors');
const { addTransactions } = require('../../../schema/transactions');


module.exports = createServerRPCMethod(

  'GET_TRANSACTION_HISTORY',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, addTransactions)) {
        scope.modules.transactions.internal.getTransactionHistory({body: params}, (error, result) => {

          resolve(error
            ? {error}
            : result);
        });
      }
      else {
        return {error: ReservedError.ServerErrorInvalidMethodParameters}
      }
    });
  });
