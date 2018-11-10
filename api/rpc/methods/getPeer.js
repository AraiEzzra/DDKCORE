const { createServerRPCMethod, validator } = require('./../util');
const { ReservedErrorCodes } = require('./../errors');
const { getPeer } = require('../../../schema/peers');


module.exports = createServerRPCMethod(

  'GET_PEER',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, getPeer)) {
        scope.modules.peers.shared.getPeer({body: params}, (error, result) => {

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
