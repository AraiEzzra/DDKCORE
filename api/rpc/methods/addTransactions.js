const { createServerRPCMethod, validator } = require('./../util');
const { ReservedErrorCodes } = require('./../errors');
const { addTransactions } = require('../../../schema/transactions');


module.exports = createServerRPCMethod(

  'ADD_TRANSACTIONS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, addTransactions)) {
        scope.modules.transactions.shared.addTransactions({body: params}, (error, result) => {

          resolve(error
            ? {error}
            : result);
        });
      }
      else {
        return {error: ReservedErrorCodes[String(ReservedErrorCodes.ServerErrorInvalidMethodParameters)]}
      }
    });
  });
