const { createServerRPCMethod, validator } = require('./../util');
const { ReservedError } = require('./../errors');
const { getVoters } = require('../../../schema/delegates');


module.exports = createServerRPCMethod(

  'GET_VOTERS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   * @param {function} cdError - Application Error callback
   */
  function (wss, params, scope, cdError) {
    return new Promise(function (resolve) {
      if (validator(params, getVoters)) {
        scope.modules.delegates.shared.getVoters({body: params}, (error, result) => {
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
