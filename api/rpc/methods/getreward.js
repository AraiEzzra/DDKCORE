const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getreward';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetReward (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getReward({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetReward);
