const { createServerRPCMethod, schemaValidator } = require('./../util');
const ReservedError = require('./../errors');
const { getPeers } = require('../../../schema/peers');


module.exports = createServerRPCMethod(

  'GET_PEERS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      if (schemaValidator(params, getPeers)) {
        scope.modules.peers.shared.getPeers({body: params}, (error, result) => {

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
