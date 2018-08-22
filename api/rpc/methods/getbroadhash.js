const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getbroadhash';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetBroadhash (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getBroadhash({body: params}, (error, result) => {
      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetBroadhash);
