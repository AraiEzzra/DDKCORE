const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getfee';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetFee (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getFee({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetFee);
