const { createServerRPCMethod } = require('./../util');


const METHOD_NAME = 'getsupply';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetSupply (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    scope.modules.blocks.submodules.api.getSupply({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });

  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetSupply);
