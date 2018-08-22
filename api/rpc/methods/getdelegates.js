const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getdelegates';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetDelegates (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.delegates.shared.getDelegates({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetDelegates);
