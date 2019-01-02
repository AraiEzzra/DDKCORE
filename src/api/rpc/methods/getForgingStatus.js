const { createServerRPCMethod, schemaValidator } = require('../util');
const ReservedError = require('../errors');
const { forgingStatus } = require('../../../schema/delegates');


module.exports = createServerRPCMethod(

  'GET_FORGING_STATUS',

  /**
   * @param {WebSocketServer} wss
   * @param {object} params
   * @param {object} scope - Application instance
   */
  function (wss, params, scope) {
    return new Promise(function (resolve) {
      if (schemaValidator(params, forgingStatus)) {
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
