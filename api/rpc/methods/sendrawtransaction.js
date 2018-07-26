const ReservedErrorCodes = require('./../errors');
const {
  METHOD_RESULT_STATUS,
  createServerRPCMethod,
  prepareServerError,
  prepareServerMethodResult,
  hasProperties,
} = require('./../util');



const METHOD_NAME = 'sendrawtransaction';

/**
 *
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - The results from current execution,
 * @constructor
 */
function SendRawTransaction (wss, params, scope) {

  return new Promise(function (resolve) {

    try {
      scope.modules.transactions.shared.addTransactions({body: params}, (err, result) => {
        if (!err) {
          resolve(result);
        } else {
          err(new Error('Error of SendRawTransaction method'))
        }
      });
    } catch (e) {
          err(new Error(e.message()))
    }


  });

}

module.exports = createServerRPCMethod(METHOD_NAME, SendRawTransaction);
