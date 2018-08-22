const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getnextforgers';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetNextForgers (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.delegates.shared.getNextForgers({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetNextForgers);
