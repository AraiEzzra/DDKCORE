const { createServerRPCMethod, schemaValidator } = require('./../util');
const ReservedError = require('./../errors');
const { getPeer } = require('../../../schema/peers');


module.exports = createServerRPCMethod(

  'GET_PEER',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      if (schemaValidator(params, getPeer)) {
        scope.modules.peers.shared.getPeer({body: params}, (error, result) => {

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
