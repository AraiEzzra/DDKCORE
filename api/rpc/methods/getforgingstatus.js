const { createServerRPCMethod, validator } = require('./../util');
const { forgingStatus } = require('../../../schema/delegates');


const METHOD_NAME = 'getforgingstatus';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetForgingStatus (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    if (validator(params, forgingStatus)) {
      scope.modules.delegates.internal.forgingStatus({body: params}, (error, result) => {

        resolve(error
          ? {error}
          : result);
      });
    }
    else {
      return {error: 'Failed operation'}
    }

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetForgingStatus);
