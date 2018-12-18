const { createServerRPCMethod, schemaValidator } = require('./../util');
const ReservedError = require('./../errors');
const { getVoters } = require('../../../schema/delegates');


module.exports = createServerRPCMethod(

  'GET_VOTERS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      if (schemaValidator(params, getVoters)) {
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
