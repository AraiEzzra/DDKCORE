const { createServerRPCMethod, validator } = require('./../util');
const { ReservedError } = require('./../errors');
const { forgingStatus } = require('../../../schema/delegates');


module.exports = createServerRPCMethod(

  'GET_FORGING_STATUS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, forgingStatus)) {
        scope.modules.delegates.internal.forgingStatus({body: params}, (error, result) => {

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
