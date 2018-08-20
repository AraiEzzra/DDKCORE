const { createServerRPCMethod, validator } = require('./../util');


const METHOD_NAME = 'getstatus';

/**
 * @param {WebSocketServer} wss
 * @param {object} params
 * @param {object} scope - Application instance,
 * @param {function} cdError - Application Error callback
 * @constructor
 */
function GetStatus (wss, params, scope, cdError) {

  return new Promise(function (resolve) {

    let error;

    scope.modules.blocks.submodules.api.getStatus({body: params}, (error, result) => {

      resolve(error
        ? {error}
        : result);
    });
  });

}

module.exports = createServerRPCMethod(METHOD_NAME, GetStatus);
