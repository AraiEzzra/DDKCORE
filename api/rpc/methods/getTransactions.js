const { createServerRPCMethod, validator } = require('./../util');
const { ReservedError } = require('./../errors');
const { getTransactions } = require('../../../schema/transactions');


module.exports = createServerRPCMethod(

  'GET_TRANSACTIONS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, getTransactions)) {
        scope.modules.transactions.shared.getTransactions({body: params}, (error, result) => {

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
